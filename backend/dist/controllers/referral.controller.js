"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferralStats = exports.validateReferralCode = void 0;
const user_model_1 = require("../models/user.model");
const validateReferralCode = async (req, res) => {
    try {
        const { code } = req.params;
        const user = await user_model_1.UserModel.findOne({ referralCode: code });
        if (!user) {
            return res.status(404).json({
                valid: false,
                message: 'Código de invitación no encontrado'
            });
        }
        res.json({
            valid: true,
            referrerName: user.name
        });
    }
    catch (error) {
        console.error('Error validando código de referidos:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.validateReferralCode = validateReferralCode;
const getReferralStats = async (req, res) => {
    try {
        // Cambiar de req.user.id a req.user.userId
        const userId = req.user.userId;
        const user = await user_model_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const referredUsers = await user_model_1.UserModel.find({
            referredBy: user.referralCode
        }).select('name email createdAt');
        res.json({
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            referredUsers
        });
    }
    catch (error) {
        console.error('Error obteniendo estadísticas de referidos:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.getReferralStats = getReferralStats;
