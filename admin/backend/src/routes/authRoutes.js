const express = require('express');
const { login, logout, getMe, register } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register); // For creating initial employee
router.get('/me', protect, getMe);

module.exports = router;
