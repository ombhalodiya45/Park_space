const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { signup, login } = require('../controllers/authController');

const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

// Route for user signup
router.post('/signup', signup);

// Route for user login
router.post('/login', login);

// Route to get current logged-in user info by verifying token cookie
router.get('/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      id: decoded.userId,
      fullName: decoded.fullName,
      email: decoded.email,
    });
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
});

module.exports = router;
