const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledAt: Date,
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  joinLink: String, 
  considered: {
    type: Boolean,
    default: false
  }, // link or room ID for joining interview
  // other fields like questions, reports etc.
});

module.exports = mongoose.model('Interview', InterviewSchema);
