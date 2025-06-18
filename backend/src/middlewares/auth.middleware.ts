import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

// Define interface for decoded token
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      }
    }
  }
}

interface DecodedToken {
  userId: string;
  role: string;
}

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret') as DecodedToken;
    
    const user = await UserModel.findById(decoded.userId)
      .select('role isVerified')
      .lean();

    if (!user) {
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ message: 'Token invalido o expirado' });
  }
};

export const isAdmin = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador' });
    return;
  }
  next();
};

export const isCommerce = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): void => {
  if (req.user?.role !== 'commerce') {
    res.status(403).json({ message: 'Acceso denegado: Se requiere rol de comercio' });
    return;
  }
  next();
};

export const isVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Usuario no autenticado' });
    return;
  }
  next();
};