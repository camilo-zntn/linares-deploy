"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
var mongoose_1 = require("mongoose");
var userSchema = new mongoose_1.Schema({
    // Autenticacion
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    // Control y permisos
    role: { type: String, enum: ['admin', 'funcionario'], default: 'funcionario' },
    status: { type: String, enum: ['pending', 'active', 'deleted'], default: 'pending' },
    isVerified: { type: Boolean, default: false },
    // Verificacion y reseteo de contraseña
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
