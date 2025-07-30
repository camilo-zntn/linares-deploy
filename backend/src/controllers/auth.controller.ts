import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import { sendVerificationEmail, sendResetPasswordEmail } from '../config/nodemailer.config';
import { generateUniqueReferralCode } from '../utils/referralGenerator';

const generateVerificationCode = (): string => {
  const randomNumber = Math.floor(Math.random() * 1000000);
  return randomNumber.toString().padStart(6, '0');
};

export const login = async (req: Request, res: Response) => {
  try {
    // 1. Validar credenciales
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

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
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 3.1 Generar token para recuperacion
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: '15m' }
      );

      // 3.2 Actualizar usuario con token
      await UserModel.findByIdAndUpdate(user._id, {
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
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

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

  } catch (error) {
    // Manejo de errores
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, rut, referralCode } = req.body; 

    // Verificar usuario existente
    const existingUser = await UserModel.findOne({ 
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
      referredByUser = await UserModel.findOne({ referralCode });
      if (!referredByUser) {
        return res.status(400).json({ 
          message: 'Código de invitación inválido'
        });
      }
    }

    // Generar código de referidos único para el nuevo usuario
    const newUserReferralCode = await generateUniqueReferralCode();

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    
    const user = new UserModel({
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
      await UserModel.findByIdAndUpdate(
        referredByUser._id,
        { $inc: { referralCount: 1 } }
      );
    }
    
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ 
      message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.' 
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const verifyAccount = async (req: Request, res: Response) => {
  try {
    // 1. Validar datos de entrada
    const { email, code } = req.body;

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ 
        message: 'El codigo debe contener exactamente 6 digitos numericos' 
      });
    }

    // 2. Buscar usuario y validar codigo
    const user = await UserModel.findOne({
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

  } catch (error) {
    // Manejo de errores
    console.error('Error en verificacion:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const sendResetEmail = async (req: Request, res: Response) => {
  try {
    // 1. Validar usuario
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 2. Generar token de restablecimiento
    const resetToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    // 3. Actualizar usuario y enviar correo
    await UserModel.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000)
    });

    await sendResetPasswordEmail(email, resetToken);

    // 4. Enviar respuesta exitosa
    res.json({ message: 'Correo de recuperacion enviado' });

  } catch (error) {
    // Manejo de errores
    console.error('Error en envio de correo:', error);
    res.status(500).json({ message: 'Error al enviar correo' });
  }
};

export const verifyResetToken = async (req: Request, res: Response) => {
  try {
    // 1. Validar token
    const { token } = req.params;
    
    const user = await UserModel.findOne({
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

  } catch (error) {
    // Manejo de errores
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al verificar token' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    // 1. Validar token y contraseña
    const { token, newPassword } = req.body;

    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalido o expirado' });
    }

    // 2. Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await UserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    // 3. Enviar respuesta exitosa
    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    // Manejo de errores
    console.error('Error:', error);
    res.status(500).json({ message: 'Error al restablecer contraseña' });
  }
};