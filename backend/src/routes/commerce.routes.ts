import { Router } from 'express';
import { commerceController } from '../controllers/commerce.controller';
import { authMiddleware, isAdmin, isCommerce } from '../middlewares/auth.middleware';
import { upload } from '../config/multer.config';

const router = Router();

router.get('/', authMiddleware, commerceController.getCommerces);
router.post('/', authMiddleware, isAdmin, upload.single('image'), commerceController.createCommerce);
router.put('/:id', authMiddleware, isAdmin, upload.single('image'), commerceController.updateCommerce);
// Rutas específicas para usuarios de comercio
router.put('/commerce/:id', authMiddleware, isCommerce, upload.single('image'), commerceController.updateCommerce);
router.get('/my-commerce', authMiddleware, isCommerce, commerceController.getMyCommerce);
router.delete('/:id', authMiddleware, isAdmin, commerceController.deleteCommerce);
router.get('/:id', authMiddleware, commerceController.getCommerceById);

export default router;