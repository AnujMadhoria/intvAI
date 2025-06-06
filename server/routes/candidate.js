const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const CandidateProfile = require('../models/CandidateProfile');
const authMiddleware = require('../middlewares/authMiddleware'); // <-- Correct import
const User = require('../models/User');
const upload = require('../middlewares/upload');
const fs = require('fs');
const Interview = require('../models/Interview');


// // Resume Upload (Multer Setup)
// const storage = multer.diskStorage({
//   destination: './uploads/resumes/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({ storage });

// Upload Resume
router.post('/upload-resume', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const id = req.user.id; // fixed here

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    let profile = await CandidateProfile.findOne({ userId: id });

    if (!profile) {
      profile = await CandidateProfile.create({ userId: id, resumeUrl });
    } else {
      profile.resumeUrl = resumeUrl;
      await profile.save();
    }

    res.json({ message: 'Resume uploaded successfully', resumeUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});   

// Get Candidate Dashboard Info
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
        console.log('Decoded user:', req.user);
   
const userId = req.user.id || req.user._id;
    const profile = await CandidateProfile.findOne({ userId }).populate({path:'reports', options:{strictPopulate: false},});
    if (!profile) {
      return res.status(404).json({ error: 'Candidate profile not found' });
    }
    res.json(profile);

  } catch (err) {
        console.error('Dashboard Error:', err); // log full error

    res.status(500).json({ error: 'Failed to load candidate dashboard' });
  }
});
// In your routes/candidate.js
router.delete('/delete-resume', authMiddleware, async (req, res) => {
  try {
    const candidate = await CandidateProfile.findOne({ userId: req.user.id });
        console.log('CandidateProfile found:', candidate);

    if (candidate && candidate.resumeUrl) {
      const filePath = path.join(__dirname, '..', candidate.resumeUrl); 
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Delete the file
      }
      candidate.resumeUrl = '';
      await candidate.save();

      res.status(200).json({ message: 'Resume deleted successfully' });
    } else {
      res.status(400).json({ message: 'No resume to delete' });
    }
  } catch (err) {
    console.error('Error deleting resume:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});
router.get('/my-interviews', authMiddleware, async (req, res) => {
  try {
    const candidateId = req.user.id;

    const interviews = await Interview.find({ candidateId })
      .populate('interviewerId', 'fullName name email') // <-- THIS IS REQUIRED
      .populate('candidateId', 'candidateName fullName name email')
      .sort({ scheduledAt: -1 })
      .lean();

    res.json(interviews);
  } catch (err) {
    console.error('Error fetching interviews:', err);
    res.status(500).json({ error: 'Failed to fetch interviews' });
  }
});



module.exports = router;
