import { prisma } from '../config/database';

export class SaleService {
    static async getAllSales(options?: {
        page?: number;
        limit?: number;
        customerId?: string;
        employeeId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const {
            page = 1,
            limit = 10,
            customerId,
            employeeId,
            startDate,
            endDate,
        } = options || {};

        const skip = (page - 1) * limit;
        const where: any = {};

        if (customerId) where.customerId = customerId;
        if (employeeId) where.employeeId = employeeId;
        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) where.saleDate.gte = startDate;
            if (endDate) where.saleDate.lte = endDate;
        }

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where,
                include: {
                    customer: true,
                    employee: { include: { userProfile: true } },
                    saleItems: { include: { product: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.sale.count({ where }),
        ]);

        return {
            sales,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    static async getSaleById(id: string) {
        return prisma.sale.findUnique({
            where: { id },
            include: {
                customer: true,
                employee: { include: { userProfile: true } },
                saleItems: { include: { product: true } },
                paymentTransactions: true,
            },
        });
    }

    static async createSale(saleData: any, createdBy: string) {
        const { items, ...rest } = saleData;

        return prisma.$transaction(async (tx) => {
            // 1. Create the sale
            const sale = await tx.sale.create({
                data: {
                    ...rest,
                    createdBy,
                    saleNumber: `SL-${Date.now()}`,
                    saleItems: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            taxAmount: item.taxAmount || 0,
                            discountAmount: item.discountAmount || 0,
                            lineTotal: item.lineTotal,
                        })),
                    },
                },
                include: {
                    saleItems: true,
                },
            });

            // 2. Update stock for each item
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) throw new Error(`Product ${item.productId} not found`);

                const newStock = Number(product.currentStock) - item.quantity;

                await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: newStock },
                });

                // 3. Create stock ledger entry
                await tx.stockLedger.create({
                    data: {
                        productId: item.productId,
                        transactionType: 'out',
                        quantity: -item.quantity,
                        previousStock: product.currentStock,
                        newStock,
                        referenceType: 'sale',
                        referenceId: sale.id,
                        createdBy,
                    },
                });
            }

            return sale;
        });
    }
}
