require('dotenv').config();
const sendWelcomeEmail = require('./sendWelcomeEmail');

async function run() {
  const to = process.env.EMAIL_USER; // send to self by default
  if (!to) {
    console.error('Missing EMAIL_USER in .env');
    process.exit(1);
  }

  try {
    console.log('Sending test email to', to);
    const res = await sendWelcomeEmail(to, 'Test');
    console.log('Test email sent:', res && res.response ? res.response : res);
    process.exit(0);
  } catch (err) {
    console.error('Test email failed:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

run();
