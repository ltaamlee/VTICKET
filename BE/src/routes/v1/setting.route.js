const express = require('express');
const router = express.Router();

const adminSystemController = require('../../controllers/v1/admin/adminSystem.controller');

router.get('/', adminSystemController.getPublicSettings);

module.exports = router;
