import { Router } from 'express';
import { authMiddleware, isCommerce } from '../middlewares/auth.middleware';
import { createDiscount, getAvailableDiscounts, getMyDiscounts } from '../controllers/discount.controller';

const router = Router();

router.post('/', authMiddleware, isCommerce, createDiscount);
router.get('/available', authMiddleware, getAvailableDiscounts);
router.get('/my', authMiddleware, isCommerce, getMyDiscounts);

export default router;

