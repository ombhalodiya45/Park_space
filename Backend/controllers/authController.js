const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Secret for JWT signing (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'yoursecretkey';

// Signup Controller
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, vehicles } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: 'Full name, email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already registered with this email' });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user document
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      vehicles: vehicles || []
    });

    // Save user to DB
    await newUser.save();

    // Return full user info with status 201
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        vehicles: newUser.vehicles
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT payload
    const payload = {
      userId: user._id,
      email: user.email,
      fullName: user.fullName
    };

    // Sign JWT token with 7 days expiration
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Set JWT token in HttpOnly cookie, expires in 7 days
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // secure flag in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      sameSite: "strict"
    });

    // Return user info (without sending token in JSON)
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        vehicles: user.vehicles
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
