import { Router } from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeTargets,
  createEmployeeTarget,
  updateEmployeeTarget,
  deleteEmployeeTarget,
  updateTargetProgress,
  bulkCreateTargets,
} from '../controllers/employeeController';
import { requireAuth, requireAdminAuth, requireManagerAuth } from '../middleware/auth';

const router = Router();

// Employee CRUD routes
router.get('/', requireAuth, getAllEmployees);
router.get('/:id', requireAuth, getEmployeeById);
router.post('/', requireAdminAuth, createEmployee);
router.put('/:id', requireAdminAuth, updateEmployee);
router.delete('/:id', requireAdminAuth, deleteEmployee);

// Employee Targets routes
router.get('/targets', requireAuth, getEmployeeTargets);
router.post('/targets', requireManagerAuth, createEmployeeTarget);
router.put('/targets/:id', requireManagerAuth, updateEmployeeTarget);
router.delete('/targets/:id', requireManagerAuth, deleteEmployeeTarget);
router.patch('/targets/:id/progress', requireAuth, updateTargetProgress);
router.post('/targets/bulk', requireManagerAuth, bulkCreateTargets);

export default router;
