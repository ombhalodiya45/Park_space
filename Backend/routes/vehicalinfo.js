const express = require('express');
const router = express.Router();
const { addVehicleController } = require('../controllers/addVehicleController');

// Correct import for authentication middleware (not errorHandler)
const authenticateMiddleware = require('../middleware/authMiddleware');

// Protect this POST route with authenticateMiddleware
router.post('/add', authenticateMiddleware, addVehicleController);

module.exports = router;
