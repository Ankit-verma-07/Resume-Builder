// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true // ✅ prevent duplicate usernames
  },
  email: {
    type: String,
    required: true,
    unique: true // ✅ prevent duplicate emails
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('User', userSchema);
