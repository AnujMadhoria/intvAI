const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middlewares/authMiddleware'); // Ensure this path is correct
const SECRET = process.env.JWT_SECRET;

// Signup
router.post('/signup',async (req, res) => {
  const { name, email, password, type } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, type });

    const token = jwt.sign({ id: user._id, type: user.type }, SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(400).json({ error: 'Email may already exist' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user._id, type: user.type }, SECRET, { expiresIn: '1d' });
  res.json({ token, user });
});
// Get User Info
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user information' });
  }
});

module.exports = router;
