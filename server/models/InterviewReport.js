// models/InterviewReport.js
const mongoose = require('mongoose');

const InterviewReportSchema = new mongoose.Schema({
  date: Date,
  status: String,
  content: String, // or whatever fields you have
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateProfile' },
});

module.exports = mongoose.model('InterviewReport', InterviewReportSchema);
