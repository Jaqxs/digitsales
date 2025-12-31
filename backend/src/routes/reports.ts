import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as reportController from '../controllers/reportController';

const router = Router();

router.get('/sales-summary', requireAuth, reportController.getSalesSummary);
router.get('/category-performance', requireAuth, reportController.getCategoryPerformance);
router.get('/valuation', requireAuth, reportController.getStockValuation);

export default router;
