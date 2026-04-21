"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_controller_1 = require("../controllers/post.controller");
const multer_config_1 = require("../config/multer.config");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public routes
router.get('/', post_controller_1.postController.getPosts);
// Admin routes
router.post('/', auth_middleware_1.authMiddleware, role_middleware_1.isAdmin, multer_config_1.upload.single('image'), post_controller_1.postController.createPost);
router.put('/layout', auth_middleware_1.authMiddleware, role_middleware_1.isAdmin, post_controller_1.postController.updateLayouts); // Batch update layout
router.put('/:id', auth_middleware_1.authMiddleware, role_middleware_1.isAdmin, multer_config_1.upload.single('image'), post_controller_1.postController.updatePost);
router.delete('/:id', auth_middleware_1.authMiddleware, role_middleware_1.isAdmin, post_controller_1.postController.deletePost);
exports.default = router;
