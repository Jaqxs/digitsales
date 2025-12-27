import { Router } from 'express';
import authRoutes from './auth';
import employeeRoutes from './employees';
import userRoutes from './users';
import productRoutes from './products';
import customerRoutes from './customers';
import saleRoutes from './sales';
import inventoryRoutes from './inventory';
import reportRoutes from './reports';

export const setupRoutes = (): Router => {
  const router = Router();

  // Health check (already handled in server.ts)
  // API routes
  router.use('/auth', authRoutes);
  router.use('/employees', employeeRoutes);
  router.use('/users', userRoutes);
  router.use('/products', productRoutes);
  router.use('/customers', customerRoutes);
  router.use('/sales', saleRoutes);
  router.use('/inventory', inventoryRoutes);
  router.use('/reports', reportRoutes);

  return router;
};
