import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const product = await prisma.product.findFirst();
        const employee = await prisma.user.findFirst();

        if (!product || !employee) {
            console.log('Need data to seed.');
            return;
        }

        console.log('Seeding 10 completed sales...');
        for (let i = 0; i < 10; i++) {
            await prisma.sale.create({
                data: {
                    saleNumber: 'RESTORED-' + Date.now() + i,
                    employeeId: employee.id,
                    subtotal: 75.50,
                    totalAmount: 75.50,
                    status: 'completed' as any,
                    createdBy: employee.id,
                    saleItems: {
                        create: [{ productId: product.id, quantity: 2, unitPrice: 37.75, lineTotal: 75.50 }]
                    }
                }
            });
        }
        console.log('✅ Restored 10 sales.');

    } catch (error: any) {
        console.error('❌ Restore failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
