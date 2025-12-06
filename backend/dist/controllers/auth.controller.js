"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.verifyResetToken = exports.sendResetEmail = exports.verifyAccount = exports.register = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("../models/user.model");
const nodemailer_config_1 = require("../config/nodemailer.config");
const referralGenerator_1 = require("../utils/referralGenerator");
const generateVerificationCode = () => {
    const randomNumber = Math.floor(Math.random() * 1000000);
    return randomNumber.toString().padStart(6, '0');
};
const login = async (req, res) => {
    try {
        // 1. Validar credenciales
        const { email, password } = req.body;
        const user = await user_model_1.UserModel.findOne({ email });
        // 2. Verificar estado del usuario
        if (!user || user.status === 'deleted') {
            return res.status(401).json({ message: 'Credenciales invalidas' });
        }
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Cuenta no verificada' });
        }
        if (user.status === 'pending') {
            return res.status(401).json({
                message: 'Tu cuenta esta pendiente de aprobacion por un administrador'
            });
        }
        // 3. Validar contraseña
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            // 3.1 Generar token para recuperacion
            const resetToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
            // 3.2 Actualizar usuario con token
            await user_model_1.UserModel.findByIdAndUpdate(user._id, {
                resetPasswordToken: resetToken,
                resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000)
            });
            return res.status(401).json({
                message: '¿Olvidaste tu contraseña? Haz clic para restablecer',
                resetPasswordAvailable: true,
                email: user.email,
                resetToken
            });
        }
        // 4. Generar token de sesion
        const token = jsonwebtoken_1.default.sign({
            userId: user._id,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: '24h' });
        // 5. Enviar respuesta exitosa con campos de referidos incluidos
        res.json({
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                commerceId: user.commerceId,
                rut: user.rut,
                referralCode: user.referralCode,
                referralCount: user.referralCount
            }
        });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { email, password, name, rut, referralCode } = req.body;
        // Verificar usuario existente
        const existingUser = await user_model_1.UserModel.findOne({
            $or: [{ email }, { rut }]
        });
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ?
                    'El correo ya esta registrado' :
                    'El RUT ya esta registrado'
            });
        }
        // Validar código de referidos si se proporciona
        let referredByUser = null;
        if (referralCode) {
            referredByUser = await user_model_1.UserModel.findOne({ referralCode });
            if (!referredByUser) {
                return res.status(400).json({
                    message: 'Código de invitación inválido'
                });
            }
        }
        // Generar código de referidos único para el nuevo usuario
        const newUserReferralCode = await (0, referralGenerator_1.generateUniqueReferralCode)();
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const verificationCode = generateVerificationCode();
        const user = new user_model_1.UserModel({
            email,
            password: hashedPassword,
            name,
            rut,
            role: 'user',
            status: 'pending',
            isVerified: false,
            verificationCode,
            verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
            referralCode: newUserReferralCode,
            referredBy: referralCode || null,
            referralCount: 0
        });
        await user.save();
        // Incrementar contador de referidos del usuario que invitó
        if (referredByUser) {
            await user_model_1.UserModel.findByIdAndUpdate(referredByUser._id, { $inc: { referralCount: 1 } });
        }
        await (0, nodemailer_config_1.sendVerificationEmail)(email, verificationCode);
        res.status(201).json({
            message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.'
        });
    }
    catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.register = register;
const verifyAccount = async (req, res) => {
    try {
        // 1. Validar datos de entrada
        const { email, code } = req.body;
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                message: 'El codigo debe contener exactamente 6 digitos numericos'
            });
        }
        // 2. Buscar usuario y validar codigo
        const user = await user_model_1.UserModel.findOne({
            email,
            verificationCode: code,
            verificationCodeExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({
                message: 'Codigo invalido o expirado'
            });
        }
        // 3. Actualizar estado de verificacion
        user.isVerified = true;
        user.set({
            verificationCode: null,
            verificationCodeExpires: null
        });
        await user.save();
        // 4. Enviar respuesta exitosa
        res.json({ message: 'Cuenta verificada exitosamente' });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error en verificacion:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};
exports.verifyAccount = verifyAccount;
const sendResetEmail = async (req, res) => {
    try {
        // 1. Validar usuario
        const { email } = req.body;
        const user = await user_model_1.UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        // 2. Generar token de restablecimiento
        const resetToken = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        // 3. Actualizar usuario y enviar correo
        await user_model_1.UserModel.findByIdAndUpdate(user._id, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000)
        });
        await (0, nodemailer_config_1.sendResetPasswordEmail)(email, resetToken);
        // 4. Enviar respuesta exitosa
        res.json({ message: 'Correo de recuperacion enviado' });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error en envio de correo:', error);
        res.status(500).json({ message: 'Error al enviar correo' });
    }
};
exports.sendResetEmail = sendResetEmail;
const verifyResetToken = async (req, res) => {
    try {
        // 1. Validar token
        const { token } = req.params;
        const user = await user_model_1.UserModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({
                message: 'Token invalido o expirado'
            });
        }
        // 2. Enviar respuesta exitosa
        res.json({
            valid: true,
            email: user.email
        });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al verificar token' });
    }
};
exports.verifyResetToken = verifyResetToken;
const resetPassword = async (req, res) => {
    try {
        // 1. Validar token y contraseña
        const { token, newPassword } = req.body;
        const user = await user_model_1.UserModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Token invalido o expirado' });
        }
        // 2. Actualizar contraseña
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await user_model_1.UserModel.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });
        // 3. Enviar respuesta exitosa
        res.json({ message: 'Contraseña actualizada exitosamente' });
    }
    catch (error) {
        // Manejo de errores
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al restablecer contraseña' });
    }
};
exports.resetPassword = resetPassword;
