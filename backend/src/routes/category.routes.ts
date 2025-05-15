import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Get all categories - Ahora público
router.get('/', categoryController.getCategories);

// Create new category
router.post('/', authMiddleware, isAdmin, categoryController.createCategory);

// Update category
router.put('/:id', authMiddleware, isAdmin, categoryController.updateCategory);

// Delete category
router.delete('/:id', authMiddleware, isAdmin, categoryController.deleteCategory);

// Get commerces by category - También público
router.get('/:id/commerces', categoryController.getCommercesByCategory);

export default router;