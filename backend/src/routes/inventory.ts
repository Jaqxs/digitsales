import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as inventoryController from '../controllers/inventoryController';

const router = Router();

router.get('/ledger', requireAuth, inventoryController.getLedger);
router.get('/low-stock', requireAuth, inventoryController.getLowStock);
router.get('/locations', requireAuth, inventoryController.getLocations);
router.post('/adjust', requireAuth, inventoryController.adjustStock);

export default router;
