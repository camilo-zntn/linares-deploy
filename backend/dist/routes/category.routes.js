"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Get all categories - Ahora público
router.get('/', category_controller_1.categoryController.getCategories);
// Create new category
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, category_controller_1.categoryController.createCategory);
// Update category
router.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, category_controller_1.categoryController.updateCategory);
// Delete category
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, category_controller_1.categoryController.deleteCategory);
// Get commerces by category - También público
router.get('/:id/commerces', category_controller_1.categoryController.getCommercesByCategory);
exports.default = router;
