import { Router } from 'express';
import { 
  getAllUsers, 
  updateUserStatus, 
  deleteUser, 
  updateUserRole, 
  assignCommerceToUser, 
  updateUser,
  updateUserProfile,
  changePassword,
  addToFavorites,
  removeFromFavorites,
  getFavoriteCommerces,
  checkIfFavorite,
  checkRutAvailability
} from '../controllers/user.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';
import { validateRutMiddleware } from '../utils/rutValidator';

const router = Router();

// Obtener todos los usuarios
router.get('/all', authMiddleware, isAdmin, getAllUsers);
// Verificar disponibilidad de RUT
router.get('/check-rut/:rut', authMiddleware, checkRutAvailability);
// Actualizar perfil del usuario autenticado
router.put('/profile', authMiddleware, updateUserProfile);
// Cambiar contraseña del usuario autenticado
router.put('/change-password', authMiddleware, changePassword);
// Actualizar el estado de un usuario
router.put('/:userId/status', authMiddleware, isAdmin, updateUserStatus);
// Eliminar un usuario del sistema
router.delete('/:id', authMiddleware, isAdmin, deleteUser);
// Actualizar el rol de un usuario
router.put('/:userId/role', authMiddleware, isAdmin, updateUserRole);
// Asignar comercio a un usuario
router.put('/:userId/commerce', authMiddleware, isAdmin, assignCommerceToUser);
// Actualizar información del usuario (solo admin puede cambiar RUT)
router.put('/:userId', authMiddleware, updateUser);

// Rutas para favoritos
router.post('/favorites', authMiddleware, addToFavorites);
router.delete('/favorites/:commerceId', authMiddleware, removeFromFavorites);
router.get('/favorites', authMiddleware, getFavoriteCommerces);
router.get('/favorites/check/:commerceId', authMiddleware, checkIfFavorite);

export default router;
