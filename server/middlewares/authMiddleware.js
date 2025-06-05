const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    console.log('Authenticated user:', decoded); // <-- add this

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
