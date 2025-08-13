// db.js
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/resumeBuilder', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected at mongodb://localhost:27017/resumeBuilder');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

module.exports = mongoose;
