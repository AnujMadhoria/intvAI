const router = require('express').Router();
const auth = require('../middlewares/authMiddleware'); // <-- Correct import
const Interview = require('../models/Interview');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const sendNotification = require('../utils/sendNotification');
const { sendInterviewScheduledEmail } = require('../utils/emailService');

// Create Interview
// Create Interview
router.post('/create', auth, async (req, res) => {
  try {
    console.log(req.body); // 👈 check what’s coming in

    const { candidateEmail, datetime } = req.body;
    const interviewerId = req.user.id;

    const candidate = await User.findOne({ email: candidateEmail });
    console.log('Candidate found:', candidate);

    if (!candidate || candidate.type !== 'candidate') {
      return res.status(400).json({ error: 'Candidate not found' });
    }

    const { v4: uuidv4 } = require('uuid');
    const joinLink = `http://localhost:5173/join-interview/${uuidv4()}`;

    const interview = await Interview.create({
      interviewerId,
      candidateId: candidate._id,
      scheduledAt: new Date(datetime),
      joinLink,
    });
    // After creating the interview
    const newInterview = await Interview.findById(interview._id)
      .populate('interviewerId', 'fullName')  // Add population
      .populate('candidateId', 'fullName email '); // Add population

    // Emit to candidate
    const io = req.app.get('io');
    io.to(candidate._id).emit('new-interview', newInterview);
    // 💡 Trigger notification here

    if (!io) {
      console.error('Socket.io instance not found on app');
    }
    await sendNotification(
      io,
      candidate._id,
      'interview',
      `You have a new interview scheduled at ${new Date(interview.scheduledAt).toLocaleString()}`,
      joinLink
    );

   
  try {
      await sendInterviewScheduledEmail(candidateEmail, {
        candidateName: candidate.fullName || candidate.name,
        scheduledAt: interview.scheduledAt,
        interviewLink: interview.joinLink
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

// Send only one response!
res.status(201).json({
  message: 'Interview created',
  interview: {
    ...interview._doc,
    interviewLink: joinLink
  }
});  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create interview' });
  }
});

// PATCH endpoint to update consideration status
router.patch('/consider/:interviewerId', auth, async (req, res) => {
  try {
    const { interviewerId } = req.params;
    const { considered } = req.body;

    // Validate input
    if (typeof considered !== 'boolean') {
      return res.status(400).json({ error: 'Invalid consideration status' });
    }

    // Find and update the interview
    const interview = await Interview.findOneAndUpdate(
      { 
        _id: interviewerId,
        interviewerId: req.user.id, // Ensure only the interviewer can update
        // status: 'completed' // Only allow for completed interviews
      },
      { considered },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found or not authorized' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Error updating consideration status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Interviewer Info
router.put('/update-info', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, email } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all interviews by interviewer
router.get('/my-interviews', auth, async (req, res) => {
  try {
    console.log('Fetching interviews for interviewer:', req.user.id);

    const interviews = await Interview.find({ interviewerId: req.user.id })
      .populate('candidateId', 'fullName name email ')
      .populate('interviewerId', 'fullName name email ') 


      .sort({ scheduledAt: -1 })
      .lean();
    // Fetch resume URLs separately
    for (const interview of interviews) {
      const profile = await CandidateProfile.findOne({ userId: interview.candidateId._id });
      if (profile && profile.resumeUrl) {
        interview.candidateId.resumeUrl = profile.resumeUrl;
      } else {
        interview.candidateId.resumeUrl = '';
      }
    }
    console.log('Interviews found:', interviews);

    const interviewsWithLink = interviews.map((int) => ({
      ...int,
      interviewLink: int.joinLink,
    }));

    res.json(interviewsWithLink);
  } catch (err) {
    console.error('Error fetching interviews:', err); // <--- log actual error
    res.status(500).json({ error: 'Error fetching interviews' });
  }
});



// Get candidate info by ID
router.get('/candidate/:id', auth, async (req, res) => {
  try {
    const candidate = await User.findById(req.params.id);
    const profile = await CandidateProfile.findOne({ userId: req.params.id });
    res.json({ candidate, profile });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching candidate' });
  }
});

module.exports = router;

