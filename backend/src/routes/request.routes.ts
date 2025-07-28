import { Router } from 'express';
import {
  createRequest,
  getAllRequests,
  getUserRequests,
  getRequestById,
  sendMessage,
  updateRequestStatus,
  markAsResolved,
  deleteRequest
} from '../controllers/request.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// Crear nueva solicitud (público o autenticado)
router.post('/', optionalAuthMiddleware, createRequest);

// Obtener todas las solicitudes (solo admin)
router.get('/all', authMiddleware, requireRole(['admin']), getAllRequests);

// Obtener solicitudes del usuario
router.get('/my-requests', authMiddleware, getUserRequests);

// Obtener solicitud por ID (público o autenticado)
router.get('/:id', optionalAuthMiddleware, getRequestById);

// Enviar mensaje en el chat (público o autenticado)
router.post('/:id/messages', optionalAuthMiddleware, sendMessage);

// Actualizar estado de solicitud (solo admin)
router.patch('/:id/status', authMiddleware, requireRole(['admin']), updateRequestStatus);

// Marcar solicitud como resuelta
router.patch('/:id/resolve', optionalAuthMiddleware, markAsResolved);

// Eliminar solicitud (solo admin)
router.delete('/:id', authMiddleware, requireRole(['admin']), deleteRequest);

export default router;