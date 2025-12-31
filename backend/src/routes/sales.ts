import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as saleController from '../controllers/saleController';

const router = Router();

router.get('/', requireAuth, saleController.getAllSales);
router.get('/:id', requireAuth, saleController.getSaleById);
router.post('/', requireAuth, saleController.createSale);

export default router;
