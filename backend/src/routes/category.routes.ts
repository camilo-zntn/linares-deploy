import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Get all categories
router.get('/', authMiddleware, categoryController.getCategories);

// Create new category
router.post('/', authMiddleware, isAdmin, categoryController.createCategory);

// Update category
router.put('/:id', authMiddleware, isAdmin, categoryController.updateCategory);

// Delete category
router.delete('/:id', authMiddleware, isAdmin, categoryController.deleteCategory);

export default router;