const express = require('express');
const cors = require('cors');
const mongoose = require('./db');
const User = require('./models/User');
const sendVerificationCode = require('./sendVerificationCode');
const sendWelcomeEmail = require('./sendWelcomeEmail');
const fetch = require('node-fetch'); // ✅ Needed for calling OpenAI
require('dotenv').config(); // ✅ To store API key in .env
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = 5001;



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

    res.json({ message: 'Login successful' });
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

// ✅ Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("❌ AI chat error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const { searchGoogle } = require("./search");

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  try {
    const results = await searchGoogle(query);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Search failed" });
  }
});



/* ------------------- Start Server ------------------- */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
