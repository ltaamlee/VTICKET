const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.route');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
// router.use('/organizer', organizerRoutes);

module.exports = router;