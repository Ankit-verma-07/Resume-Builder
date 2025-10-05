require('dotenv').config();
const nodemailer = require('nodemailer');

// Configure your email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Use environment variable
    pass: process.env.EMAIL_PASSWORD // Use environment variable
  }
});

async function sendVerificationCode(email, name, code) {
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString();

  const mailOptions = {
    from: `"Resume Builder" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Resume Builder',
    html: `
      <div style="font-family:sans-serif; color:#333;">
        <h2>Hello ${name || 'User'},</h2>
        <p>Your OTP is: <strong style="font-size:18px;">${code}</strong></p>
        <p>This code will expire at <strong>${expiryTime}</strong>.</p>
        <br/>
        <p>Thanks,<br/>Resume Builder Team</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', result.response);
    return result;
  } catch (error) {
    console.error('❌ OTP email failed to send:', error);
    throw error;
  }
}

module.exports = sendVerificationCode;
