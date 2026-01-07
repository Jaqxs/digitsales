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
  router.get('/diag', async (req, res) => {
    try {
      const { prisma } = await import('../config/database');
      const count = await prisma.sale.count();
      const enums = await prisma.$queryRawUnsafe("SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'SaleStatus'");
      const dbInfo = await prisma.$queryRawUnsafe("SELECT current_database(), current_schema()");

      // Test create
      const product = await prisma.product.findFirst();
      const employee = await prisma.user.findFirst();
      let testResult = "N/A";
      if (product && employee) {
        try {
          const s = await prisma.sale.create({
            data: {
              saleNumber: 'DIAG-' + Date.now(),
              employeeId: employee.id,
              subtotal: 0,
              totalAmount: 0,
              status: 'awaiting_delivery' as any,
              createdBy: employee.id,
              saleItems: {
                create: [{ productId: product.id, quantity: 1, unitPrice: 0, lineTotal: 0 }]
              }
            }
          });
          testResult = "Success: " + s.id;
        } catch (err: any) {
          testResult = "Error: " + err.message;
        }
      }

      res.json({ count, enums, dbInfo, testResult });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // EMERGENCY FIX ROUTE for Remote Databases
  router.get('/force-sync-db', async (req, res) => {
    try {
      const { prisma } = await import('../config/database');
      const results: string[] = [];

      const tables: any[] = await prisma.$queryRawUnsafe(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
      results.push(`Found tables: ${tables.map(t => t.table_name).join(', ')}`);

      const runSql = async (sql: string, desc: string) => {
        try {
          await prisma.$executeRawUnsafe(sql);
          results.push(`✅ ${desc}`);
        } catch (e: any) {
          results.push(`❌ ${desc}: ${e.message}`);
        }
      };

      results.push('--- EMERGENCY DB SYNC STARTED ---');
      await runSql(`ALTER TYPE "SaleStatus" ADD VALUE IF NOT EXISTS 'awaiting_delivery'`, 'Enum SaleStatus');

      // Try both "sales" and "Sale" just in case
      for (const t of ['sales', 'Sale']) {
        await runSql(`ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(6)`, `Column confirmedAt on ${t}`);
        await runSql(`ALTER TABLE "${t}" ADD COLUMN IF NOT EXISTS "confirmedBy" UUID`, `Column confirmedBy on ${t}`);
        await runSql(`ALTER TABLE "${t}" ALTER COLUMN "status" SET DEFAULT 'awaiting_delivery'`, `Default status on ${t}`);
      }

      res.json({
        success: true,
        summary: results,
        message: "Check the summary. If you see Green checks for 'sales', restart Dokploy."
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

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
