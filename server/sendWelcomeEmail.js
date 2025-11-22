require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify SMTP configuration early and provide actionable logs
transporter.verify().then(() => {
  console.log('✅ SMTP transporter verified for sendWelcomeEmail');
}).catch(err => {
  console.error('❌ SMTP verify failed in sendWelcomeEmail:', err && err.message ? err.message : err);
  if (err && err.code === 'EAUTH') {
    console.error('Hint: EAUTH (Authentication failed). Ensure `EMAIL_USER` is your full Gmail address and `EMAIL_PASSWORD` is a valid app password (if you use 2-Step Verification).');
    console.error('See: https://support.google.com/mail/?p=BadCredentials and https://support.google.com/accounts/answer/185833');
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
    if (error && error.code === 'EAUTH') {
      console.error('❗ Authentication error when sending welcome email. Common fixes:');
      console.error('- Verify `EMAIL_USER` (full email) and `EMAIL_PASSWORD` in your .env');
      console.error('- If Gmail, enable 2-Step Verification and create an App Password, then use it as `EMAIL_PASSWORD`');
      console.error('- Alternatively, use OAuth2 (recommended for production) or an external SMTP provider (SendGrid, Mailgun)');
    }
    throw error;
  }
}

module.exports = sendWelcomeEmail;
