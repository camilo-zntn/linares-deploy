// src/routes/log.routes.ts
import { Router } from 'express';
import { logController } from '../controllers/log.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Obtener todos los logs (solo admin)
router.get('/', authMiddleware, isAdmin, logController.getLogs);

// Crear nuevo log (cualquier usuario autenticado)
router.post('/', authMiddleware, logController.createLog);

export default router;