import { PrismaClient, UserRole, CustomerType, LocationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Create Admin User
    const adminEmail = 'admin@zantrix.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            role: UserRole.admin,
            isActive: true,
            userProfile: {
                create: {
                    firstName: 'System',
                    lastName: 'Admin',
                    phone: '+255 700 000 000',
                },
            },
        },
    });

    console.log(`✅ Admin user created: ${admin.email}`);

    // 2. Create Stock Location
    const location = await prisma.stockLocation.create({
        data: {
            name: 'Main Warehouse',
            type: LocationType.warehouse,
            address: '123 Main Street, Dar es Salaam',
        },
    });

    console.log(`✅ Stock location created: ${location.name}`);

    // 3. Create Product Category
    const category = await prisma.productCategory.create({
        data: {
            name: 'Construction Tools',
            description: 'Power tools and equipment',
        },
    });

    console.log(`✅ Product category created: ${category.name}`);

    // 4. Create Sample Customer
    const customer = await prisma.customer.create({
        data: {
            firstName: 'John',
            lastName: 'Kamau',
            email: 'john.kamau@email.com',
            phone: '+255 712 111 222',
            customerType: CustomerType.individual,
            createdBy: admin.id,
        },
    });

    console.log(`✅ Sample customer created: ${customer.firstName} ${customer.lastName}`);

    // 5. Create Sample Product
    const product = await prisma.product.create({
        data: {
            name: 'Bosch Professional Drill',
            sku: 'PWR-000002',
            barcode: '8901234567891',
            description: '18V Cordless hammer drill',
            costPrice: 450000,
            sellingPrice: 650000,
            currentStock: 25,
            minStockLevel: 5,
            unit: 'unit',
            categoryId: category.id,
            createdBy: admin.id,
        },
    });

    console.log(`✅ Sample product created: ${product.name}`);

    console.log('🏁 Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
