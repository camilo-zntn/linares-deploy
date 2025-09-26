import express from 'express';
import { getCommerceByCategory, getUserStats } from '../controllers/analyticsController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/commerce-by-category', authMiddleware, getCommerceByCategory);
router.get('/user-stats', authMiddleware, getUserStats);

export default router;