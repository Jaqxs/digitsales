import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as productController from '../controllers/productController';

const router = Router();

router.get('/', requireAuth, productController.getAllProducts);
router.get('/:id', requireAuth, productController.getProductById);
router.post('/', requireAuth, productController.createProduct);
router.put('/:id', requireAuth, productController.updateProduct);
router.delete('/:id', requireAuth, productController.deleteProduct);
router.post('/stock', requireAuth, productController.updateStock);

export default router;
