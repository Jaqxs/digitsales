import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as customerController from '../controllers/customerController';

const router = Router();

router.get('/', requireAuth, customerController.getAllCustomers);
router.get('/:id', requireAuth, customerController.getCustomerById);
router.post('/', requireAuth, customerController.createCustomer);
router.put('/:id', requireAuth, customerController.updateCustomer);
router.delete('/:id', requireAuth, customerController.deleteCustomer);

export default router;
