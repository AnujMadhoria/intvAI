const mongoose = require('mongoose');

const CandidateProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumeUrl: String,
  suggestions: [String],
  reports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport' }],
});

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
