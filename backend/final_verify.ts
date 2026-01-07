import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const product = await prisma.product.findFirst();
        const employee = await prisma.user.findFirst();

        if (product && employee) {
            console.log('Testing sale creation inside a transaction...');
            await prisma.$transaction(async (tx) => {
                const sale = await tx.sale.create({
                    data: {
                        saleNumber: 'TX-TEST-' + Date.now(),
                        employeeId: employee.id,
                        subtotal: 1,
                        totalAmount: 1,
                        status: 'awaiting_delivery' as any,
                        createdBy: employee.id,
                        saleItems: {
                            create: [{ productId: product.id, quantity: 1, unitPrice: 1, lineTotal: 1 }]
                        }
                    }
                });
                console.log('✅ Transaction Inner success:', sale.id);
            });
            console.log('✅ Transaction Committed!');
        }
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
