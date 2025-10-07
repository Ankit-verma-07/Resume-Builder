const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // basic styling options
  fontFamily: { type: String, default: 'Arial, sans-serif' },
  fontSize: { type: Number, default: 14 },
  fontColor: { type: String, default: '#222' },
  headingColor: { type: String, default: '#4a90e2' },
  accentColor: { type: String, default: '#4a90e2' },
  textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
  headingFontSize: { type: Number, default: 20 },
  backgroundColor: { type: String, default: '#ffffff' },
  profileBorderColor: { type: String, default: '#4a90e2' },
  // per-section styles (optional)
  sectionStyles: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', templateSchema);
