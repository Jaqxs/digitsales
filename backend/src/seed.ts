import { PrismaClient, UserRole, CustomerType, LocationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Create Admin User
    const adminEmail = 'admin@zantrix.co.tz';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash: hashedPassword,
            isActive: true,
        },
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

    // 1.1 Create Manager User
    const managerEmail = 'manager@zantrix.co.tz';
    const managerHashedPassword = await bcrypt.hash('manager123', 10);
    await prisma.user.upsert({
        where: { email: managerEmail },
        update: {
            passwordHash: managerHashedPassword,
            isActive: true,
        },
        create: {
            email: managerEmail,
            passwordHash: managerHashedPassword,
            role: UserRole.manager,
            isActive: true,
            userProfile: {
                create: {
                    firstName: 'Store',
                    lastName: 'Manager',
                    phone: '+255 700 000 001',
                },
            },
        },
    });
    console.log(`✅ Manager user created: ${managerEmail}`);

    // 1.2 Create Sales User
    const salesEmail = 'sales@zantrix.co.tz';
    const salesHashedPassword = await bcrypt.hash('sales123', 10);
    await prisma.user.upsert({
        where: { email: salesEmail },
        update: {
            passwordHash: salesHashedPassword,
            isActive: true,
        },
        create: {
            email: salesEmail,
            passwordHash: salesHashedPassword,
            role: UserRole.sales,
            isActive: true,
            userProfile: {
                create: {
                    firstName: 'Sales',
                    lastName: 'Associate',
                    phone: '+255 700 000 002',
                },
            },
        },
    });
    console.log(`✅ Sales user created: ${salesEmail}`);

    // 2. Create Stock Location
    const location = await prisma.stockLocation.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
        update: {},
        create: {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Main Warehouse',
            type: LocationType.warehouse,
            address: '123 Main Street, Dar es Salaam',
        },
    });

    console.log(`✅ Stock location created: ${location.name}`);

    // 3. Create Product Category
    const category = await prisma.productCategory.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440002' },
        update: {},
        create: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Construction Tools',
            description: 'Power tools and equipment',
        },
    });

    console.log(`✅ Product category created: ${category.name}`);

    // 4. Create Sample Customer
    const customer = await prisma.customer.upsert({
        where: { id: '550e8400-e29b-41d4-a716-446655440003' },
        update: {},
        create: {
            id: '550e8400-e29b-41d4-a716-446655440003',
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
    const product = await prisma.product.upsert({
        where: { sku: 'PWR-000002' },
        update: {},
        create: {
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
