const express = require("express");
const router = express.Router();
const categoryController = require("../../controllers/v1/category/category.controller");

// Hỗ trợ cả /api/v1/categories và /api/v1/categories/categories (tương thích ngược)
router.get("/", categoryController.getCategories);
router.get("/categories", categoryController.getCategories);

module.exports = router;
