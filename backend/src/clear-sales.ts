import { prisma } from './config/database';

async function clearSales() {
    console.log('🗑️  Starting to clear sales data...');

    try {
        // Delete all sales - CASCADE should handle SaleItem and PaymentTransaction
        const deletedSales = await prisma.sale.deleteMany({});

        console.log(`✅  Deleted ${deletedSales.count} sales records.`);
        console.log('    (Sale items and transactions should be auto-deleted via Cascade)');

        console.log('🎉  Sales data cleared successfully!');
    } catch (error) {
        console.error('❌  Error clearing sales data:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

clearSales();
