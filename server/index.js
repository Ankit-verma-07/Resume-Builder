const express = require('express');
const cors = require('cors');
const mongoose = require('./db');
const User = require('./models/User');
const sendVerificationCode = require('./sendVerificationCode');
const sendWelcomeEmail = require('./sendWelcomeEmail');
const fetch = require('node-fetch'); // ✅ Needed for calling OpenAI
require('dotenv').config(); // ✅ To store API key in .env
require('./db');
const fs = require('fs');
const path = require('path');
const Admin = require('./models/Admin');
const FeedbackModel = require('./models/Feedback');
const ResumeModel = require('./models/Resume');
const UserResume = require('./models/UserResume');
const Template = require('./models/Template');
const { GridFSBucket } = require('mongodb');

// Helper to update users.json with all users
async function updateUsersJson() {
  try {
    const users = await User.find({}, { _id: 0, password: 0, __v: 0 });
    const filePath = path.join(__dirname, 'users.json');
    // Remove any feedbacks property to keep users.json focused on user data
    const sanitized = users.map(u => {
      const obj = u.toObject ? u.toObject() : u;
      delete obj.feedbacks;
      return obj;
    });
    fs.writeFileSync(filePath, JSON.stringify(sanitized, null, 2));
  } catch (err) {
    console.error('❌ Failed to update users.json:', err);
  }
}
const app = express();
const PORT = process.env.PORT || 5001;

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'undefined');

app.use(cors());
// Increase JSON payload size to handle base64 PDF uploads from the client
app.use(express.json({ limit: '50mb' }));
// Also add urlencoded parser with increased limit in case form data is used
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory OTP stores
const pendingRegistrations = {};
const otpStore = new Map();

// Generate 6-digit OTP
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ Registration - Step 1: Send OTP
app.post('/api/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check both DB and in-memory pending users
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing || pendingRegistrations[email] || Object.values(pendingRegistrations).some(u => u.username === username)) {
      console.log('🔍 Checking for existing user or pending email/username...');
      return res.status(409).json({ error: 'User already exists or is pending verification' });
    }

    const code = generateCode();
    pendingRegistrations[email] = {
      name,
      username,
      password,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    console.log(`📬 Sending registration OTP to ${email}: ${code}`);
    await sendVerificationCode(email, name, code);

    res.json({ message: 'OTP sent to email', code });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Registration - Step 2: Verify OTP and Save User
app.post('/api/verify-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    const pending = pendingRegistrations[email];
    if (!pending) {
      return res.status(400).json({ error: 'No pending registration found' });
    }

    if (pending.code !== code) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (Date.now() > pending.expiresAt) {
      delete pendingRegistrations[email];
      return res.status(400).json({ error: 'OTP expired' });
    }

    const { name, username, password } = pending;
    const newUser = new User({ name, username, email, password });
    await newUser.save();
    delete pendingRegistrations[email];

    await sendWelcomeEmail(email, name);
    await updateUsersJson();
    res.status(200).json({ message: 'Registration complete' });
  } catch (err) {
    console.error('❌ OTP verification error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Login (email or username)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email/username and password required' });

  try {
    const user = await User.findOne({
      $or: [{ email }, { username: email }],
      password
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // ✅ return user info so frontend can use _id for feedback
    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        // feedbacks are stored in separate collection
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Admin login (check Admin collection)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const admin = await Admin.findOne({ username });
    if (!admin || admin.password !== password) return res.status(401).json({ error: 'Invalid admin credentials' });

    res.json({ message: 'Admin login successful', admin: { username: admin.username } });
  } catch (err) {
    console.error('❌ Admin login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Forgot Password: Send OTP
app.post('/api/forgot-password', async (req, res) => {
  const { emailOrUsername } = req.body;
  if (!emailOrUsername) {
    return res.status(400).json({ error: 'Email or username is required' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = generateCode();
    otpStore.set(user.email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    console.log(`📬 Sending reset OTP to ${user.email}: ${code}`);
    await sendVerificationCode(user.email, user.name, code);

    res.json({ message: 'OTP sent to registered email', email: user.email });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Reset Password via OTP
app.post('/api/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const stored = otpStore.get(email);
  if (!stored) return res.status(400).json({ error: 'No OTP found' });

  if (stored.code !== code) return res.status(400).json({ error: 'Invalid code' });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = newPassword;
    await user.save();
    otpStore.delete(email);

    await updateUsersJson();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ error: 'Could not reset password' });
  }
});

// ✅ Cancel pending registration if user exits registration
app.post('/api/cancel-registration', (req, res) => {
  const { email } = req.body;
  if (email && pendingRegistrations[email]) {
    delete pendingRegistrations[email];
    return res.status(200).json({ message: 'Pending registration cancelled' });
  }
  res.status(404).json({ error: 'No pending registration found' });
});

// ✅ Resend OTP for pending registration
app.post('/api/resend-otp', async (req, res) => {
  const { email } = req.body;
  const pending = pendingRegistrations[email];
  if (!pending) {
    return res.status(400).json({ error: 'No pending registration found' });
  }

  const code = generateCode();
  pending.code = code;
  pending.expiresAt = Date.now() + 10 * 60 * 1000;

  try {
    console.log(`📬 Resending OTP to ${email}: ${code}`);
    await sendVerificationCode(email, pending.name, code);
    res.json({ message: 'New OTP sent' });
  } catch (err) {
    console.error('❌ Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});


// ✅ Get all registered users with feedbacks
app.get('/api/users', async (req, res) => {
  try {
    // Fetch users and attach feedbacks from Feedback collection
    // Include password so admin can view it in dashboard (stored as plain text in DB)
    const users = await User.find({}, { name: 1, email: 1, username: 1, password: 1, _id: 1 });
    const usersWithFeedbacks = await Promise.all(users.map(async (u) => {
      const fbs = await FeedbackModel.find({ userId: u._id }, { message: 1, createdAt: 1, _id: 0 }).sort({ createdAt: -1 });
      return { _id: u._id, name: u.name, email: u.email, username: u.username, password: u.password, feedbacks: fbs };
    }));
    res.json({ users: usersWithFeedbacks });
  } catch (err) {
    console.error('❌ Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});



// ✅ Delete single user by email
app.delete('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const result = await User.deleteOne({ email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    await updateUsersJson();
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ✅ Delete all users
app.delete('/api/users', async (req, res) => {
  try {
    await User.deleteMany({});
    await updateUsersJson();
    res.json({ message: 'All users deleted' });
  } catch (err) {
    console.error('❌ Delete all users error:', err);
    res.status(500).json({ error: 'Failed to delete all users' });
  }
});

// ✅ Feedback API
app.post("/api/feedback", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: "Missing userId or message" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Save into separate Feedback collection
    const fb = await FeedbackModel.create({ userId: user._id, name: user.name, email: user.email, message });
    res.json({ success: true, feedback: fb });
  } catch (err) {
    console.error("❌ Feedback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Save exported resume (called by frontend when user exports PDF)
app.post('/api/resume', async (req, res) => {
  try {
    const { userId, data } = req.body;
    console.log('POST /api/resume body:', { userId, hasData: !!data });
    if (!userId || !data) return res.status(400).json({ error: 'Missing userId or data' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Keep old json storage too
    const saved = await ResumeModel.create({ userId: user._id, username: user.username, name: user.name, email: user.email, data });
    console.log('Saved resume id:', saved._id);

    // Also store a PDF representation in GridFS if `data.pdfBase64` is provided
    if (data && data.pdfBase64) {
      try {
        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'user_resume' });
        const buffer = Buffer.from(data.pdfBase64, 'base64');
        const uploadStream = bucket.openUploadStream(`${user.username || user.email}-resume.pdf`, { contentType: 'application/pdf' });
        uploadStream.end(buffer);
        uploadStream.on('finish', async () => {
          const fileId = uploadStream.id;
          await UserResume.create({ userId: user._id, username: user.username, email: user.email, filename: uploadStream.filename, fileId });
          console.log('Saved resume PDF to GridFS id:', fileId);
        });
      } catch (e) {
        console.error('Failed to save PDF to GridFS', e);
      }
    }

    res.json({ success: true, resume: saved });
  } catch (err) {
    console.error('❌ Save resume error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List user_resume entries (admin)
app.get('/api/user-resumes', async (req, res) => {
  try {
    const items = await UserResume.find({}, { __v: 0 }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error('❌ Fetch user resumes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Download a resume file from GridFS by fileId
app.get('/api/user-resume/:fileId', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'user_resume' });
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on('error', (err) => {
      console.error('GridFS download error', err);
      res.status(404).send('File not found');
    });
    res.setHeader('Content-Type', 'application/pdf');
    downloadStream.pipe(res);
  } catch (err) {
    console.error('❌ Download resume error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get all resumes (admin)
app.get('/api/resumes', async (req, res) => {
  try {
    // Return full resume documents including the stored JSON `data` so admin can inspect user-entered fields
    const resumes = await ResumeModel.find({}).sort({ createdAt: -1 });
    console.log('GET /api/resumes count:', resumes.length);
    res.json({ resumes });
  } catch (err) {
    console.error('❌ Fetch resumes error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Templates: create and list
app.post('/api/templates', async (req, res) => {
  try {
    console.log('POST /api/templates received headers:', req.headers['content-type']);
    console.log('POST /api/templates body preview:', JSON.stringify(req.body).substring(0, 500));
    const data = req.body;
    if (!data || !data.name) return res.status(400).json({ error: 'Template name required' });
    const t = await Template.create(data);
    res.json({ template: t });
  } catch (err) {
    console.error('❌ Create template error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await Template.find({}).sort({ createdAt: -1 });
    res.json({ templates });
  } catch (err) {
    console.error('❌ Fetch templates error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a template by id
app.delete('/api/templates/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Template.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    console.error('❌ Delete template error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get a user's feedbacks
app.get("/api/user/:id/feedbacks", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '_id');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const feedbacks = await FeedbackModel.find({ userId: req.params.id }, { message: 1, createdAt: 1, _id: 0 }).sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (err) {
    console.error("❌ Fetch feedbacks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------- Start Server ------------------- */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  // Ensure default admin exists
  (async () => {
    try {
      const existing = await Admin.findOne({ username: 'admin' });
      if (!existing) {
        await Admin.create({ username: 'admin', password: 'admin@123' });
        console.log('✅ Default admin created (username: admin, password: admin@123)');
      } else {
        console.log('ℹ️ Default admin already exists');
      }
    } catch (err) {
      console.error('❌ Error ensuring default admin:', err);
    }
  })();
});
