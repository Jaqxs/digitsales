import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminUsers = await prisma.user.findMany({
        where: { role: 'admin' },
        select: { email: true, id: true }
    });
    console.log('Admin Users:', adminUsers);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
