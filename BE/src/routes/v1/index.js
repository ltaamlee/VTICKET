const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.route');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
// router.use('/organizer', organizerRoutes);

module.exports = router;