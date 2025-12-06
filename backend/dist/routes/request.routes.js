"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const request_controller_1 = require("../controllers/request.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Crear nueva solicitud (público o autenticado)
router.post('/', auth_middleware_1.optionalAuthMiddleware, request_controller_1.createRequest);
// Obtener todas las solicitudes (solo admin)
router.get('/all', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(['admin']), request_controller_1.getAllRequests);
// Obtener solicitudes del usuario
router.get('/my-requests', auth_middleware_1.authMiddleware, request_controller_1.getUserRequests);
// Obtener solicitud por ID (público o autenticado)
router.get('/:id', auth_middleware_1.optionalAuthMiddleware, request_controller_1.getRequestById);
// Enviar mensaje en el chat (público o autenticado)
router.post('/:id/messages', auth_middleware_1.optionalAuthMiddleware, request_controller_1.sendMessage);
// Actualizar estado de solicitud (solo admin)
router.patch('/:id/status', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(['admin']), request_controller_1.updateRequestStatus);
// Marcar solicitud como resuelta
router.patch('/:id/resolve', auth_middleware_1.optionalAuthMiddleware, request_controller_1.markAsResolved);
// Eliminar solicitud (solo admin)
router.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.requireRole)(['admin']), request_controller_1.deleteRequest);
exports.default = router;
