import express from 'express';
import { getCommerceByCategory, getUserStats, postAnalyticsEvent, getUserAnalytics, getTopCommerces, getCategoryAnalytics, getCommerceAnalytics } from '../controllers/analyticsController';
import { authMiddleware } from '../middlewares/auth.middleware';
import { analyticsRateLimiter } from '../middlewares/analyticsRate.middleware';

const router = express.Router();

router.get('/commerce-by-category', authMiddleware, getCommerceByCategory);
router.get('/category-analytics', authMiddleware, getCategoryAnalytics);
router.get('/commerce-analytics', authMiddleware, getCommerceAnalytics);
router.get('/user-stats', authMiddleware, getUserStats);
router.get('/top-commerces', authMiddleware, getTopCommerces);
router.post('/events', authMiddleware, analyticsRateLimiter, postAnalyticsEvent);
router.get('/user/:userId?', authMiddleware, getUserAnalytics);

export default router;