const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginUser, registerUser, googleAuthCallback } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:3000/login?error=Google%20auth%20failed' }), googleAuthCallback);

module.exports = router;
