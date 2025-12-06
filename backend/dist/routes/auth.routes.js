"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const rutValidator_1 = require("../utils/rutValidator");
const router = (0, express_1.Router)();
// Registro de usuarios (con validación de RUT)
router.post('/register', (0, rutValidator_1.validateRutMiddleware)('rut'), auth_controller_1.register);
// Verificacion de cuenta
router.post('/verify', auth_controller_1.verifyAccount);
// Inicio de sesion 
router.post('/login', auth_controller_1.login);
// Solicitud de restablecimiento de contraseña 
router.post('/reset-password', auth_controller_1.sendResetEmail);
// Token de restablecimiento de contraseña
router.get('/verify-reset-token/:token', auth_controller_1.verifyResetToken);
// Establecimiento de nueva contraseña 
router.post('/reset-password/new', auth_controller_1.resetPassword);
exports.default = router;
