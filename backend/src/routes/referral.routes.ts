import { Router } from 'express';
import { validateReferralCode, getReferralStats } from '../controllers/referral.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Validar código de referidos (público)
router.get('/validate/:code', validateReferralCode);

// Obtener estadísticas de referidos (autenticado)
router.get('/stats', authMiddleware, getReferralStats);

export default router;