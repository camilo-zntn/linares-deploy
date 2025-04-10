// src/routes/log.routes.ts
import { Router } from 'express';
import { logController } from '../controllers/log.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Obtener todos los logs
router.get('/', authMiddleware, isAdmin, logController.getLogs);

export default router;