const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password").lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid token - User not found"
        });
      }

      // Normalize the id so downstream code can use either
      req.user = {
        ...user,
        userId: user._id.toString()
      };

      return next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please login again."
        });
      }
      if (jwtError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token. Please login again."
        });
      }
      throw jwtError;
    }
  } catch (error) {
    console.error("Auth Middleware Error:", { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication"
    });
  }
};

module.exports = authMiddleware;
