import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, id: true }
    });
    console.log('All Users:', allUsers);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
