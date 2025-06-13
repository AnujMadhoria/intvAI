const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  type: { type: String, enum: ['candidate', 'interviewer'], required: true },
  createdAt: { type: Date, default: Date.now },
  resumeUrl: { type: String },
  

});

module.exports = mongoose.model('User', UserSchema);
