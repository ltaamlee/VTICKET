const express = require('express');
const router = express.Router();
const userController = require('../../controllers/v1/user/user.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

// All profile endpoints require authentication
router.use(authenticate);

// View user profile
router.get('/profile', userController.getProfile);

// Update user profile information (fullName, phone, dob, avatar)
router.put('/profile', userController.updateProfile);
router.patch('/profile', userController.updateProfile);

module.exports = router;
