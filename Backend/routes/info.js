const express = require('express');
const router = express.Router();
const { saveInfo, getInfo } = require('../controllers/infoController');
const authenticateMiddleware = require('../middleware/authMiddleware');

router.post('/save', authenticateMiddleware, saveInfo);
router.get('/get', authenticateMiddleware, getInfo);

module.exports = router;
