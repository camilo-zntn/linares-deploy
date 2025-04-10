import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();


const createTransporter = async () => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: 'oyey jzxz tetr otua' // Tu contraseña de aplicacion
      }
    });

    await transporter.verify();
    return transporter;
  } catch (err) {
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

export const sendVerificationEmail = async (email: string, code: string): Promise<boolean> => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"Sistema de Digitalizacion" <${process.env.EMAIL_USER}>`,
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
  } catch (err: any) {
    console.error('Error en sendVerificationEmail:', err);
    throw new Error(`Error al enviar email: ${err?.message || 'Error desconocido'}`);
  }
};

export const sendResetPasswordEmail = async (email: string, resetToken: string): Promise<boolean> => {
  try {
    const transporter = await createTransporter();
    const resetLink = `${process.env.FRONTEND_URL}/views/auth/recovery?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Sistema de Digitalizacion" <${process.env.EMAIL_USER}>`,
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
  } catch (err: any) {
    console.error('Error en sendResetPasswordEmail:', err);
    throw new Error(`Error al enviar email de recuperacion: ${err?.message || 'Error desconocido'}`);
  }
};