import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { userProfile: true }
    });
    console.log('All Users and Profiles:');
    users.forEach(u => {
        console.log(`- ${u.email} [${u.role}] ID: ${u.id} Name: ${u.userProfile?.firstName} ${u.userProfile?.lastName}`);
    });
}

main().finally(() => prisma.$disconnect());
