"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const analyticsRate_middleware_1 = require("../middlewares/analyticsRate.middleware");
const router = express_1.default.Router();
router.get('/commerce-by-category', auth_middleware_1.authMiddleware, analyticsController_1.getCommerceByCategory);
router.get('/category-analytics', auth_middleware_1.authMiddleware, analyticsController_1.getCategoryAnalytics);
router.get('/commerce-analytics', auth_middleware_1.authMiddleware, analyticsController_1.getCommerceAnalytics);
router.get('/user-stats', auth_middleware_1.authMiddleware, analyticsController_1.getUserStats);
router.get('/top-commerces', auth_middleware_1.authMiddleware, analyticsController_1.getTopCommerces);
router.post('/events', auth_middleware_1.authMiddleware, analyticsRate_middleware_1.analyticsRateLimiter, analyticsController_1.postAnalyticsEvent);
router.get('/user/:userId?', auth_middleware_1.authMiddleware, analyticsController_1.getUserAnalytics);
exports.default = router;
