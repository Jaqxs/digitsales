import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const nonAdmins = await prisma.user.findMany({
        where: { NOT: { role: 'admin' } },
        select: { id: true, email: true }
    });

    console.log(`Found ${nonAdmins.length} non-admin users.`);

    for (const user of nonAdmins) {
        const productsCount = await prisma.product.count({ where: { createdBy: user.id } });
        const customersCount = await prisma.customer.count({ where: { createdBy: user.id } });
        const salesCount = await prisma.sale.count({ where: { OR: [{ employeeId: user.id }, { createdBy: user.id }] } });

        if (productsCount > 0 || customersCount > 0 || salesCount > 0) {
            console.log(`User ${user.email} has: ${productsCount} products, ${customersCount} customers, ${salesCount} sales.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
