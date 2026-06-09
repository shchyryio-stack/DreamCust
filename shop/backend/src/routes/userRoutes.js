const express = require('express');
const router = express.Router();
const { updateProfile, getUsers } = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/').get(protect, admin, getUsers);
router.put('/profile', protect, updateProfile);

module.exports = router;
