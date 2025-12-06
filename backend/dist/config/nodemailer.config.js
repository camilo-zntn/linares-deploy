"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewSuggestionNotification = exports.sendNewReportNotification = exports.sendResetPasswordEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const createTransporter = async () => {
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: 'oyey jzxz tetr otua' // Tu contraseña de aplicacion
            }
        });
        await transporter.verify();
        return transporter;
    }
    catch (err) {
        console.error('Error al crear transporter:', err);
        throw err;
    }
};
// Funcion para validar variables de entorno
const validateEnvVars = () => {
    const required = [
        'EMAIL_USER',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REFRESH_TOKEN'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
    }
};
const sendVerificationEmail = async (email, code) => {
    try {
        const transporter = await createTransporter();
        const mailOptions = {
            from: `"Linares" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verificacion de Cuenta',
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Verificacion de cuenta</title>
            <style>
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .header {
                text-align: center;
                padding: 20px;
                background-color: #10B981;
                color: white;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 30px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 0 0 8px 8px;
              }
              .code {
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                letter-spacing: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Verificacion de Cuenta</h1>
              </div>
              <div class="content">
                <p>Para verificar tu cuenta, ingresa el siguiente codigo:</p>
                <div class="code">${code}</div>
                <p style="color: #666; font-size: 14px;">
                  Este codigo expirara en 15 minutos.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
        };
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch (err) {
        console.error('Error en sendVerificationEmail:', err);
        throw new Error(`Error al enviar email: ${(err === null || err === void 0 ? void 0 : err.message) || 'Error desconocido'}`);
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = async (email, resetToken) => {
    try {
        const transporter = await createTransporter();
        const resetLink = `${process.env.FRONTEND_URL}/views/auth/recovery?token=${resetToken}`;
        const mailOptions = {
            from: `"Linares" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Recuperacion de Contraseña',
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Recuperacion de Contraseña</title>
            <style>
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .header {
                text-align: center;
                padding: 20px;
                background-color: #10B981;
                color: white;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 30px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 0 0 8px 8px;
              }
              .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: #10B981;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Recuperacion de Contraseña</h1>
              </div>
              <div class="content">
                <p>Has solicitado restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente boton para crear una nueva contraseña:</p>
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Restablecer Contraseña</a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  Este enlace expirara en 15 minutos por motivos de seguridad.
                </p>
                <p style="color: #666; font-size: 14px;">
                  Si no solicitaste este cambio, ignora este correo.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
        };
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch (err) {
        console.error('Error en sendResetPasswordEmail:', err);
        throw new Error(`Error al enviar email de recuperacion: ${(err === null || err === void 0 ? void 0 : err.message) || 'Error desconocido'}`);
    }
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
// Función para enviar notificación de nuevo reporte (color rojo)
const sendNewReportNotification = async (userEmail, subject, description) => {
    try {
        const transporter = await createTransporter();
        const mailOptions = {
            from: `"🚨 Reporte de Problema" <${process.env.EMAIL_USER}>`,
            to: 'contacto.zntn@gmail.com', // Enviar al email configurado en .env
            subject: subject, // Usar la variable subject en lugar del texto hardcodeado
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Nuevo Reporte</title>
            <style>
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .header {
                text-align: center;
                padding: 20px;
                background-color: #DC2626;
                color: white;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 30px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 0 0 8px 8px;
              }
              .info-box {
                background-color: #FEF2F2;
                border-left: 4px solid #DC2626;
                padding: 15px;
                margin: 15px 0;
              }
              .label {
                font-weight: bold;
                color: #DC2626;
                margin-bottom: 5px;
              }
              .value {
                color: #374151;
                margin-bottom: 15px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <p>Se ha recibido un nuevo reporte de problema en el sistema.</p>
                
                <div class="info-box">
                  <div class="label">Email del Usuario:</div>
                  <div class="value">${userEmail}</div>
                  
                  <div class="label">Asunto:</div>
                  <div class="value">${subject}</div>
                  
                  <div class="label">Descripción del Problema:</div>
                  <div class="value">${description}</div>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  Por favor, revisa el panel de administración para gestionar este reporte.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
        };
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch (err) {
        console.error('Error en sendNewReportNotification:', err);
        throw new Error(`Error al enviar notificación de reporte: ${(err === null || err === void 0 ? void 0 : err.message) || 'Error desconocido'}`);
    }
};
exports.sendNewReportNotification = sendNewReportNotification;
// Función para enviar notificación de nueva sugerencia (color amarillo)
const sendNewSuggestionNotification = async (userEmail, subject, description) => {
    try {
        const transporter = await createTransporter();
        const mailOptions = {
            from: `"💡 Sugerencia de Mejora" <${process.env.EMAIL_USER}>`,
            to: 'contacto.zntn@gmail.com', // Enviar al email configurado en .env
            subject: subject,
            html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Nueva Sugerencia de Mejora</title>
            <style>
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
              }
              .header {
                text-align: center;
                padding: 20px;
                background-color: #F59E0B;
                color: white;
                border-radius: 8px 8px 0 0;
              }
              .content {
                padding: 30px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 0 0 8px 8px;
              }
              .info-box {
                background-color: #FFFBEB;
                border-left: 4px solid #F59E0B;
                padding: 15px;
                margin: 15px 0;
              }
              .label {
                font-weight: bold;
                color: #F59E0B;
                margin-bottom: 5px;
              }
              .value {
                color: #374151;
                margin-bottom: 15px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <p>Se ha recibido una nueva sugerencia de mejora en el sistema.</p>
                
                <div class="info-box">
                  <div class="label">Email del Usuario:</div>
                  <div class="value">${userEmail}</div>
                  
                  <div class="label">Asunto:</div>
                  <div class="value">${subject}</div>
                  
                  <div class="label">Descripción de la Sugerencia:</div>
                  <div class="value">${description}</div>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  Por favor, revisa el panel de administración para gestionar esta sugerencia.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
        };
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch (err) {
        console.error('Error en sendNewSuggestionNotification:', err);
        throw new Error(`Error al enviar notificación de sugerencia: ${(err === null || err === void 0 ? void 0 : err.message) || 'Error desconocido'}`);
    }
};
exports.sendNewSuggestionNotification = sendNewSuggestionNotification;
