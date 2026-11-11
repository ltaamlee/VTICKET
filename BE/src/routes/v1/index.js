const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.route');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const organizerRoutes = require('./organizer.route');
const eventRoutes = require('./event.route');
const categoryRoutes = require('./category.route');
const forumRoutes = require('./forum.route');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/organizer', organizerRoutes);
router.use('/events', eventRoutes);
router.use('/categories', categoryRoutes);
router.use('/forum', forumRoutes);

module.exports = router;
