const nodemailer = require('nodemailer');

// 🔐 Replace with your Gmail and App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'akkisoni1517@gmail.com',         // ✅ Your Gmail
    pass: 'jwrjvayqviywdyfx'       // ✅ App Password from Google
  }
});

async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: '"Resume Builder" <yourgmail@gmail.com>',
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
