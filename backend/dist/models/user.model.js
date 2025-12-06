"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const rutValidator_1 = require("../utils/rutValidator");
const referralGenerator_1 = require("../utils/referralGenerator");
const userSchema = new mongoose_1.Schema({
    // Autenticacion
    rut: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (rut) {
                return (0, rutValidator_1.validateRut)(rut).isValid;
            },
            message: 'RUT inválido'
        }
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    // Control y permisos
    role: { type: String, enum: ['admin', 'commerce', 'user'], default: 'user' },
    status: { type: String, enum: ['pending', 'active', 'deleted'], default: 'pending' },
    isVerified: { type: Boolean, default: false },
    // Verificacion y reseteo de contraseña
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    // Referencia al comercio
    commerceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Commerce', default: null },
    // Campo para favoritos
    favoriteCommerces: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Commerce', default: [] }],
    // Nuevos campos para sistema de referidos
    referralCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    referredBy: {
        type: String,
        default: null,
        index: true
    },
    referralCount: {
        type: Number,
        default: 0
    }
});
// Middleware pre-save para generar referralCode si no existe
userSchema.pre('save', async function (next) {
    if (!this.referralCode) {
        try {
            this.referralCode = await (0, referralGenerator_1.generateUniqueReferralCode)();
        }
        catch (error) {
            return next(error);
        }
    }
    next();
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
