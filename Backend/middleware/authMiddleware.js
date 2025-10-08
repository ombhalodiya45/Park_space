const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateMiddleware = async (req, res, next) => {
  let token;

  // Get token from cookie instead of header
  token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (excluding password field)
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Continue to next middleware/controller
    next();
    
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = authenticateMiddleware;
