"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueReferralCode = exports.generateReferralCode = void 0;
// Caracteres seguros separados por tipo
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMBERS = '23456789';
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Función para garantizar combinación de números y letras
const generateReferralCode = (length = 6) => {
    if (length < 2) {
        throw new Error('La longitud mínima debe ser 2 para garantizar números y letras');
    }
    let result = '';
    // Garantizar al menos una letra y un número
    result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
    result += NUMBERS.charAt(Math.floor(Math.random() * NUMBERS.length));
    // Completar el resto con caracteres aleatorios
    for (let i = 2; i < length; i++) {
        result += SAFE_CHARS.charAt(Math.floor(Math.random() * SAFE_CHARS.length));
    }
    // Mezclar los caracteres para que la letra y número no estén siempre al inicio
    return result.split('').sort(() => Math.random() - 0.5).join('');
};
exports.generateReferralCode = generateReferralCode;
const generateUniqueReferralCode = async () => {
    const { UserModel } = await Promise.resolve().then(() => __importStar(require('../models/user.model')));
    let code;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    while (!isUnique && attempts < maxAttempts) {
        code = (0, exports.generateReferralCode)();
        const existingUser = await UserModel.findOne({ referralCode: code });
        if (!existingUser) {
            isUnique = true;
            return code;
        }
        attempts++;
    }
    // Si no se pudo generar un código único, usar timestamp
    // Garantizar que el fallback también tenga números y letras
    const fallbackCode = (0, exports.generateReferralCode)(4) + Date.now().toString().slice(-2);
    return fallbackCode;
};
exports.generateUniqueReferralCode = generateUniqueReferralCode;
