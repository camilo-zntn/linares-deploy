import { Router } from 'express';
import { commerceController } from '../controllers/commerce.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';
import { upload } from '../config/multer.config';

const router = Router();

router.get('/', authMiddleware, commerceController.getCommerces);
router.post('/', authMiddleware, isAdmin, upload.single('image'), commerceController.createCommerce);
router.put('/:id', authMiddleware, isAdmin, upload.single('image'), commerceController.updateCommerce);
router.delete('/:id', authMiddleware, isAdmin, commerceController.deleteCommerce);

export default router;