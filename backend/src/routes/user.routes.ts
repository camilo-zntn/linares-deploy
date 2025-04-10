import { Router } from 'express';
import { getAllUsers, updateUserStatus, deleteUser } from '../controllers/user.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Obtener todos los usuarios
router.get('/all', authMiddleware, isAdmin, getAllUsers);
// Actualizar el estado de un usuario
router.put('/:userId/status', authMiddleware, isAdmin, updateUserStatus);
// Eliminar un usuario del sistema
router.delete('/:id', authMiddleware, isAdmin, deleteUser);

export default router;