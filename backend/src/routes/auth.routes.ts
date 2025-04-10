import { Router } from 'express';
import { 
  login, 
  register, 
  verifyAccount, 
  sendResetEmail, 
  verifyResetToken,
  resetPassword 
} from '../controllers/auth.controller';

const router = Router();

// Registro de usuarios
router.post('/register', register);
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