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

// Verify SMTP configuration early and provide actionable logs
transporter.verify().then(() => {
  console.log('✅ SMTP transporter verified for sendVerificationCode');
}).catch(err => {
  console.error('❌ SMTP verify failed in sendVerificationCode:', err && err.message ? err.message : err);
  if (err && err.code === 'EAUTH') {
    console.error('Hint: EAUTH (Authentication failed). Ensure `EMAIL_USER` is your full Gmail address and `EMAIL_PASSWORD` is a valid app password (if you use 2-Step Verification).');
    console.error('See: https://support.google.com/mail/?p=BadCredentials and https://support.google.com/accounts/answer/185833');
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
    if (error && error.code === 'EAUTH') {
      console.error('❗ Authentication error when sending OTP. Common fixes:');
      console.error('- Verify `EMAIL_USER` (full email) and `EMAIL_PASSWORD` in your .env');
      console.error('- If Gmail, enable 2-Step Verification and create an App Password, then use it as `EMAIL_PASSWORD`');
      console.error('- Alternatively, use OAuth2 (recommended for production) or an external SMTP provider (SendGrid, Mailgun)');
    }
    throw error;
  }
}

module.exports = sendVerificationCode;
