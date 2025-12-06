"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commerce_controller_1 = require("../controllers/commerce.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const multer_config_1 = require("../config/multer.config");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authMiddleware, commerce_controller_1.commerceController.getCommerces);
router.post('/', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, multer_config_1.upload.single('image'), commerce_controller_1.commerceController.createCommerce);
router.put('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, multer_config_1.upload.single('image'), commerce_controller_1.commerceController.updateCommerce);
// Rutas específicas para usuarios de comercio
router.put('/commerce/:id', auth_middleware_1.authMiddleware, auth_middleware_1.isCommerce, multer_config_1.upload.single('image'), commerce_controller_1.commerceController.updateCommerce);
router.get('/my-commerce', auth_middleware_1.authMiddleware, auth_middleware_1.isCommerce, commerce_controller_1.commerceController.getMyCommerce);
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, commerce_controller_1.commerceController.deleteCommerce);
router.get('/:id', auth_middleware_1.authMiddleware, commerce_controller_1.commerceController.getCommerceById);
exports.default = router;
