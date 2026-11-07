const express = require("express");
const router = express.Router();

const categoryController = require("../../controllers/v1/category/category.controller");

router.get("/categories", categoryController.getCategories);

module.exports = router;