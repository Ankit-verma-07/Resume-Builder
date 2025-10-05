require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: `"Resume Builder" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Resume Builder!',
    html: `
      <div style="font-family:sans-serif; color:#333;">
        <h2>Welcome ${name || 'User'}!</h2>
        <p>Thank you for registering with Resume Builder.</p>
        <p>We're excited to help you build beautiful resumes.</p>
        <br/>
        <p>Cheers,<br/>The Resume Builder Team</p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent:', result.response);
    return result;
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    throw error;
  }
}

module.exports = sendWelcomeEmail;
