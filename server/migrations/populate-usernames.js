const mongoose = require('../db');
const User = require('../models/User');

async function run() {
  try {
    const users = await User.find({ $or: [{ username: { $exists: false } }, { username: null }, { username: '' }] });
    console.log(`Found ${users.length} users missing username`);
    let updated = 0;

    for (const u of users) {
      if (u.email) {
        const fallback = u.email.split('@')[0];
        u.username = fallback;
        await u.save();
        updated++;
        console.log(`Updated ${u._id} -> username=${fallback}`);
      }
    }

    console.log(`Migration complete. Updated ${updated} users.`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    mongoose.connection.close();
  }
}

run();
