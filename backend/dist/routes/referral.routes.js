"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const referral_controller_1 = require("../controllers/referral.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Validar código de referidos (público)
router.get('/validate/:code', referral_controller_1.validateReferralCode);
// Obtener estadísticas de referidos (autenticado)
router.get('/stats', auth_middleware_1.authMiddleware, referral_controller_1.getReferralStats);
exports.default = router;
