"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyDiscounts = exports.getAvailableDiscounts = exports.createDiscount = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const discount_model_1 = require("../models/discount.model");
const user_model_1 = require("../models/user.model");
const createDiscount = async (req, res) => {
    try {
        const { user } = req;
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'commerce') {
            return res.status(403).json({ message: 'Solo comercios pueden crear descuentos' });
        }
        const dbUser = await user_model_1.UserModel.findById(user.userId).select('commerceId');
        if (!(dbUser === null || dbUser === void 0 ? void 0 : dbUser.commerceId)) {
            return res.status(400).json({ message: 'Usuario comercio sin comercio asignado' });
        }
        const { title, description, percent, minReferrals, active } = req.body || {};
        if (!title || !description || !percent || minReferrals === undefined) {
            return res.status(400).json({ message: 'Faltan campos requeridos' });
        }
        const doc = await discount_model_1.DiscountModel.create({
            commerceId: new mongoose_1.default.Types.ObjectId(dbUser.commerceId),
            title,
            description,
            percent: Number(percent),
            minReferrals: Number(minReferrals),
            active: active !== undefined ? Boolean(active) : true,
        });
        res.status(201).json({ id: doc._id });
    }
    catch (error) {
        console.error('Error creando descuento:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.createDiscount = createDiscount;
const getAvailableDiscounts = async (req, res) => {
    try {
        const { user } = req;
        if (!user)
            return res.status(401).json({ message: 'No autenticado' });
        let matchStage = { active: true };
        if (user.role === 'user') {
            const dbUser = await user_model_1.UserModel.findById(user.userId).select('referralCount');
            if (!dbUser)
                return res.status(404).json({ message: 'Usuario no encontrado' });
            matchStage.minReferrals = { $lte: dbUser.referralCount || 0 };
        }
        else if (user.role === 'admin') {
            // Admin ve todos sin restriccion
        }
        else {
            // Otros roles no ven la seccion de usuario
            return res.status(403).json({ message: 'No autorizado' });
        }
        const discounts = await discount_model_1.DiscountModel.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: 'commerces',
                    localField: 'commerceId',
                    foreignField: '_id',
                    as: 'commerceInfo',
                },
            },
            { $unwind: '$commerceInfo' },
            {
                $project: {
                    _id: 0,
                    discountId: '$_id',
                    title: 1,
                    description: 1,
                    percent: 1,
                    minReferrals: 1,
                    commerceId: '$commerceId',
                    commerceName: '$commerceInfo.name',
                    imageUrl: '$commerceInfo.imageUrl',
                    createdAt: 1,
                },
            },
            { $sort: { createdAt: -1 } },
        ]);
        res.json({ discounts });
    }
    catch (error) {
        console.error('Error obteniendo descuentos disponibles:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getAvailableDiscounts = getAvailableDiscounts;
const getMyDiscounts = async (req, res) => {
    try {
        const { user } = req;
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'commerce') {
            return res.status(403).json({ message: 'Solo comercios' });
        }
        const dbUser = await user_model_1.UserModel.findById(user.userId).select('commerceId');
        if (!(dbUser === null || dbUser === void 0 ? void 0 : dbUser.commerceId))
            return res.status(400).json({ message: 'Sin comercio asignado' });
        const list = await discount_model_1.DiscountModel.find({ commerceId: dbUser.commerceId }).sort({ createdAt: -1 }).lean();
        res.json({ discounts: list });
    }
    catch (error) {
        console.error('Error obteniendo mis descuentos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
exports.getMyDiscounts = getMyDiscounts;
