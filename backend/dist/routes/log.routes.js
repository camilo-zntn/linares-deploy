"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/log.routes.ts
const express_1 = require("express");
const log_controller_1 = require("../controllers/log.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Obtener todos los logs (solo admin)
router.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.isAdmin, log_controller_1.logController.getLogs);
// Crear nuevo log (cualquier usuario autenticado)
router.post('/', auth_middleware_1.authMiddleware, log_controller_1.logController.createLog);
exports.default = router;
