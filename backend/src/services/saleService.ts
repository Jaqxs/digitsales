import { prisma } from '../config/database';
import { SaleStatus } from '@prisma/client';

export class SaleService {
    static async getAllSales(options?: {
        page?: number;
        limit?: number;
        customerId?: string;
        employeeId?: string;
        startDate?: Date;
        endDate?: Date;
        status?: string;
    }) {
        const {
            page = 1,
            limit = 10,
            customerId,
            employeeId,
            startDate,
            endDate,
            status,
        } = options || {};

        const skip = (page - 1) * limit;
        const where: any = {};

        if (customerId) where.customerId = customerId;
        if (employeeId) where.employeeId = employeeId;
        if (status) where.status = status;
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
        const {
            employeeId,
            customerId,
            subtotal,
            discountAmount,
            taxAmount,
            totalAmount,
            paymentMethod,
            notes,
            items
        } = saleData;

        return prisma.$transaction(async (tx) => {
            // 1. Create the sale
            const sale = await tx.sale.create({
                data: {
                    employeeId,
                    customerId,
                    subtotal: Number(subtotal),
                    discountAmount: Number(discountAmount || 0),
                    taxAmount: Number(taxAmount || 0),
                    totalAmount: Number(totalAmount),
                    paymentMethod,
                    notes,
                    createdBy,
                    saleNumber: `SL-${Date.now()}`,
                    status: 'awaiting_delivery' as any,
                    saleItems: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: Number(item.quantity),
                            unitPrice: Number(item.unitPrice),
                            taxAmount: Number(item.taxAmount || 0),
                            discountAmount: Number(item.discountAmount || 0),
                            lineTotal: Number(item.lineTotal),
                        })),
                    },
                },
                include: {
                    customer: true,
                    employee: {
                        include: {
                            userProfile: true
                        }
                    },
                    saleItems: {
                        include: {
                            product: true
                        }
                    },
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

    static async deleteAllSales() {
        return prisma.sale.deleteMany({});
    }

    static async confirmSale(saleId: string, confirmedBy: string) {
        return prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({
                where: { id: saleId },
                include: { saleItems: true }
            });

            if (!sale) throw new Error('Sale not found');
            if ((sale.status as string) !== 'awaiting_delivery') {
                throw new Error(`Sale cannot be confirmed. Current status: ${sale.status}`);
            }

            return tx.sale.update({
                where: { id: saleId },
                data: {
                    status: 'completed',
                    confirmedAt: new Date(),
                    confirmedBy,
                } as any,
            });
        });
    }
}
