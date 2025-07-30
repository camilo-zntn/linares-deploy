import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

export const validateReferralCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    
    const user = await UserModel.findOne({ referralCode: code });
    
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
    
  } catch (error) {
    console.error('Error validando código de referidos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const getReferralStats = async (req: Request, res: Response) => {
  try {
    // Cambiar de req.user.id a req.user.userId
    const userId = (req as any).user.userId;
    
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const referredUsers = await UserModel.find({ 
      referredBy: user.referralCode 
    }).select('name email createdAt');

    res.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referredUsers
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de referidos:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};