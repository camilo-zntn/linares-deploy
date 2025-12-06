import { Router } from 'express';
import { authMiddleware, isCommerce } from '../middlewares/auth.middleware';
import { createDiscount, getAvailableDiscounts, getMyDiscounts, updateDiscount, deleteDiscount } from '../controllers/discount.controller';

const router = Router();

router.post('/', authMiddleware, isCommerce, createDiscount);
router.get('/available', authMiddleware, getAvailableDiscounts);
router.get('/my', authMiddleware, isCommerce, getMyDiscounts);
router.put('/:id', authMiddleware, isCommerce, updateDiscount);
router.delete('/:id', authMiddleware, isCommerce, deleteDiscount);

export default router;
