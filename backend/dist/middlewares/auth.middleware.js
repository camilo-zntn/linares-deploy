"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.isVerified = exports.isCommerce = exports.isAdmin = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const authMiddleware = async (req, res, next) => {
    var _a, _b, _c;
    try {
        let token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token && req.query && typeof req.query.token === 'string') {
            token = req.query.token;
        }
        if (!token) {
            res.status(401).json({ message: 'Token no proporcionado' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'defaultSecret');
        const user = await user_model_1.UserModel.findById(decoded.userId)
            .select('name email role isVerified commerceId')
            .lean();
        if (!user) {
            res.status(401).json({ message: 'Usuario no encontrado' });
            return;
        }
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            name: user.name,
            email: user.email,
            commerceId: (_c = (_b = user.commerceId) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b)
        };
        next();
    }
    catch (error) {
        console.error('Error:', error);
        res.status(401).json({ message: 'Token invalido o expirado' });
    }
};
exports.authMiddleware = authMiddleware;
const isAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
        return;
    }
    next();
};
exports.isAdmin = isAdmin;
const isCommerce = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'commerce') {
        res.status(403).json({ message: 'Acceso denegado: Se requiere rol de comercio' });
        return;
    }
    next();
};
exports.isCommerce = isCommerce;
const isVerified = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Usuario no autenticado' });
        return;
    }
    next();
};
exports.isVerified = isVerified;
// Nuevo middleware opcional para solicitudes de soporte
const optionalAuthMiddleware = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'defaultSecret');
                const user = await user_model_1.UserModel.findById(decoded.userId)
                    .select('name email role isVerified')
                    .lean();
                if (user) {
                    req.user = {
                        userId: decoded.userId,
                        role: decoded.role,
                        name: user.name,
                        email: user.email
                    };
                }
            }
            catch (error) {
                // Si el token es inválido, continuar sin usuario
                console.log('Token inválido, continuando sin autenticación');
            }
        }
        next();
    }
    catch (error) {
        console.error('Error en middleware opcional:', error);
        next();
    }
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
