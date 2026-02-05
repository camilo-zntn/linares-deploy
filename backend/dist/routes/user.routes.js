"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Obtener todos los usuarios
router.get('/all', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, user_controller_1.getAllUsers);
// Verificar disponibilidad de RUT
router.get('/check-rut/:rut', auth_middleware_1.authMiddleware, user_controller_1.checkRutAvailability);
// Actualizar perfil del usuario autenticado
router.put('/profile', auth_middleware_1.authMiddleware, user_controller_1.updateUserProfile);
// Cambiar contraseña del usuario autenticado
router.put('/change-password', auth_middleware_1.authMiddleware, user_controller_1.changePassword);
// Actualizar el estado de un usuario
router.put('/:userId/status', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, user_controller_1.updateUserStatus);
// Eliminar un usuario del sistema
router.delete('/:id', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, user_controller_1.deleteUser);
// Actualizar el rol de un usuario
router.put('/:userId/role', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, user_controller_1.updateUserRole);
// Asignar comercio a un usuario
router.put('/:userId/commerce', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, user_controller_1.assignCommerceToUser);
// Actualizar información del usuario (solo admin puede cambiar RUT)
router.put('/:userId', auth_middleware_1.authMiddleware, user_controller_1.updateUser);
// Rutas para favoritos
router.post('/favorites', auth_middleware_1.authMiddleware, user_controller_1.addToFavorites);
router.delete('/favorites/:commerceId', auth_middleware_1.authMiddleware, user_controller_1.removeFromFavorites);
router.get('/favorites', auth_middleware_1.authMiddleware, user_controller_1.getFavoriteCommerces);
router.get('/favorites/check/:commerceId', auth_middleware_1.authMiddleware, user_controller_1.checkIfFavorite);
exports.default = router;
