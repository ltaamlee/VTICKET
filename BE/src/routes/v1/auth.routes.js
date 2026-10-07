const express = require('express');
const router = express.Router();
const authController = require('../../controllers/v1/user/auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// Public auth routes
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);

module.exports = router;
