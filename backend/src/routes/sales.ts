import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as saleController from '../controllers/saleController';

const router = Router();

router.get('/', requireAuth, saleController.getAllSales);
router.get('/:id', requireAuth, saleController.getSaleById);
router.post('/', requireAuth, saleController.createSale);
router.delete('/', requireAuth, saleController.deleteAllSales);

export default router;
