const express = require('express');
const router = express.Router();
const authController = require('../../controllers/v1/user/auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// Public auth routes
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/google-login',  authController.googleLogin);

module.exports = router;
