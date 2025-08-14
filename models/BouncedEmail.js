const mongoose = require('mongoose');

const bouncedEmailSchema = new mongoose.Schema({
  email: { type: String, required: true },
  type: { type: String, enum: ['Bounce', 'Complaint'], required: true },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BouncedEmail', bouncedEmailSchema);
