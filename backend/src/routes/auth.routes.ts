import { Router } from 'express';
import { 
  login, 
  register, 
  verifyAccount, 
  sendResetEmail, 
  verifyResetToken,
  resetPassword 
} from '../controllers/auth.controller';
import { validateRutMiddleware } from '../utils/rutValidator';

const router = Router();

// Registro de usuarios (con validación de RUT)
router.post('/register', validateRutMiddleware('rut'), register);
// Verificacion de cuenta
router.post('/verify', verifyAccount); 
// Inicio de sesion 
router.post('/login', login);
// Solicitud de restablecimiento de contraseña 
router.post('/reset-password', sendResetEmail);
// Token de restablecimiento de contraseña
router.get('/verify-reset-token/:token', verifyResetToken);
// Establecimiento de nueva contraseña 
router.post('/reset-password/new', resetPassword);

export default router;