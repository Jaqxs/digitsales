
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const count = await prisma.product.count();
    const sales = await prisma.sale.count();
    console.log('--- DATA STATUS ---');
    console.log('Products:', count);
    console.log('Sales:', sales);
    if (count > 0) {
        const p = await prisma.product.findFirst();
        console.log('Sample product:', p?.name);
    }
}
run().catch(console.error).finally(() => prisma.$disconnect());
