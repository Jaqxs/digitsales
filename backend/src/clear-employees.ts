import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminToKeep = 'admin@zantrix.co.tz';

    // Find all users except the one to keep
    const usersToDelete = await prisma.user.findMany({
        where: { email: { not: adminToKeep } }
    });

    console.log(`Found ${usersToDelete.length} users to remove.`);

    const mainAdmin = await prisma.user.findUnique({ where: { email: adminToKeep } });

    if (!mainAdmin) {
        console.error('CRITICAL: Primary admin (admin@zantrix.co.tz) not found in database.');
        return;
    }

    for (const user of usersToDelete) {
        console.log(`Cleaning up data for ${user.email}...`);

        try {
            // Handle non-cascading relations
            await prisma.employeeTargets.deleteMany({ where: { userId: user.id } });
            await prisma.employeeTargets.deleteMany({ where: { createdBy: user.id } });
            await prisma.stockLedger.deleteMany({ where: { createdBy: user.id } });
            await prisma.stockAdjustment.deleteMany({ where: { createdBy: user.id } });
            await prisma.stockAdjustment.deleteMany({ where: { approvedBy: user.id } });
            await prisma.paymentTransaction.deleteMany({ where: { processedBy: user.id } });
            await prisma.generalLedger.deleteMany({ where: { createdBy: user.id } });

            // Reassign products/customers to the main admin
            await prisma.product.updateMany({ where: { createdBy: user.id }, data: { createdBy: mainAdmin.id } });
            await prisma.customer.updateMany({ where: { createdBy: user.id }, data: { createdBy: mainAdmin.id } });
            await prisma.supplier.updateMany({ where: { createdBy: user.id }, data: { createdBy: mainAdmin.id } });
            await prisma.sale.updateMany({ where: { employeeId: user.id }, data: { employeeId: mainAdmin.id } });
            await prisma.sale.updateMany({ where: { createdBy: user.id }, data: { createdBy: mainAdmin.id } });
            await prisma.purchaseOrder.updateMany({ where: { createdBy: user.id }, data: { createdBy: mainAdmin.id } });
            await prisma.purchaseOrder.updateMany({ where: { approvedBy: user.id }, data: { approvedBy: mainAdmin.id } });
            await prisma.purchaseOrder.updateMany({ where: { receivedBy: user.id }, data: { receivedBy: mainAdmin.id } });

            // Hard delete the user (Profile and Sessions will cascade)
            await prisma.user.delete({ where: { id: user.id } });
            console.log(`✅ Successfully removed ${user.email}`);
        } catch (error: any) {
            console.error(`❌ Failed to remove ${user.email}:`, error.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
