import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { upload } from '../config/multer.config';
import { authMiddleware } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/role.middleware';

const router = Router();

// Public routes
router.get('/', postController.getPosts);

// Admin routes
router.post('/', authMiddleware, isAdmin, upload.single('image'), postController.createPost);
router.put('/layout', authMiddleware, isAdmin, postController.updateLayouts); // Batch update layout
router.put('/:id', authMiddleware, isAdmin, upload.single('image'), postController.updatePost);
router.delete('/:id', authMiddleware, isAdmin, postController.deletePost);

export default router;
