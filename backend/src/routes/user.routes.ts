import { Router } from 'express';
import { getAllUsers, updateUserStatus, deleteUser, updateUserRole, assignCommerceToUser, updateUser } from '../controllers/user.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Obtener todos los usuarios
router.get('/all', authMiddleware, isAdmin, getAllUsers);
// Actualizar el estado de un usuario
router.put('/:userId/status', authMiddleware, isAdmin, updateUserStatus);
// Eliminar un usuario del sistema
router.delete('/:id', authMiddleware, isAdmin, deleteUser);
// Actualizar el rol de un usuario
router.put('/:userId/role', authMiddleware, isAdmin, updateUserRole);
// Asignar comercio a un usuario
router.put('/:userId/commerce', authMiddleware, isAdmin, assignCommerceToUser);
// Actualizar información del usuario
router.put('/:userId', authMiddleware, isAdmin, updateUser);

export default router;