import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { CustomRequest } from '../interfaces/custom';

// Define interface for decoded token
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        name?: string;
        email?: string;
      }
    }
  }
}

interface DecodedToken {
  userId: string;
  role: string;
}

export const authMiddleware = async (
  req: CustomRequest,
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
      .select('name email role isVerified')
      .lean();

    if (!user) {
      res.status(401).json({ message: 'Usuario no encontrado' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      name: user.name,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ message: 'Token invalido o expirado' });
  }
};

export const isAdmin = (
  req: CustomRequest, 
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
  req: CustomRequest, 
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
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Usuario no autenticado' });
    return;
  }
  next();
};

// Nuevo middleware opcional para solicitudes de soporte
export const optionalAuthMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret') as DecodedToken;
        
        const user = await UserModel.findById(decoded.userId)
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
      } catch (error) {
        // Si el token es inválido, continuar sin usuario
        console.log('Token inválido, continuando sin autenticación');
      }
    }
    
    next();
  } catch (error) {
    console.error('Error en middleware opcional:', error);
    next();
  }
};