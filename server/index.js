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

// Helper to update users.json with all users
async function updateUsersJson() {
  try {
    const users = await User.find({}, { _id: 0, password: 0, __v: 0 });
    const filePath = path.join(__dirname, 'users.json');
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('❌ Failed to update users.json:', err);
  }
}
const app = express();
const PORT = 5001;

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'undefined');

app.use(cors());
app.use(express.json());

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
        feedbacks: user.feedbacks || []
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
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


// ✅ Get all registered users
app.get('/api/users', async (req, res) => {
  try {
const users = await User.find({}, { name: 1, email: 1, feedbacks: 1, _id: 1 });
    res.json({ users });
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

    user.feedbacks.push({ message });
    await user.save();

    res.json({ success: true, feedbacks: user.feedbacks });
  } catch (err) {
    console.error("❌ Feedback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get a user's feedbacks
app.get("/api/user/:id/feedbacks", async (req, res) => {
  try {
    const user = await User.findById(req.params.id, "feedbacks");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ feedbacks: user.feedbacks });
  } catch (err) {
    console.error("❌ Fetch feedbacks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ------------------- Start Server ------------------- */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
