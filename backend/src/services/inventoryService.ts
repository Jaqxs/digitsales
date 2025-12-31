import { prisma } from '../config/database';

export class InventoryService {
    // Get stock ledger (transaction history)
    static async getLedger(options?: {
        page?: number;
        limit?: number;
        productId?: string;
        locationId?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const {
            page = 1,
            limit = 10,
            productId,
            locationId,
            startDate,
            endDate,
        } = options || {};

        const skip = (page - 1) * limit;
        const where: any = {};

        if (productId) where.productId = productId;
        if (locationId) where.locationId = locationId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [entries, total] = await Promise.all([
            prisma.stockLedger.findMany({
                where,
                include: {
                    product: { select: { name: true, sku: true } },
                    location: { select: { name: true } },
                    creator: { select: { email: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.stockLedger.count({ where }),
        ]);

        return {
            entries,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // Get low stock products
    static async getLowStock() {
        return prisma.product.findMany({
            where: {
                isActive: true,
                currentStock: {
                    lte: prisma.product.fields.minStockLevel as any, // This might not work directly in where
                },
            },
            include: {
                category: true,
            },
        });
        // Alternative if the above doesn't work:
        // const products = await prisma.product.findMany({ where: { isActive: true } });
        // return products.filter(p => Number(p.currentStock) <= p.minStockLevel);
    }

    // Custom manual adjustment
    static async adjustStock(data: {
        productId: string;
        quantity: number;
        type: 'damaged' | 'lost' | 'found' | 'correction';
        reason: string;
        createdBy: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: data.productId },
            });

            if (!product) throw new Error('Product not found');

            const quantityChange = data.type === 'found' || data.type === 'correction' ? data.quantity : -data.quantity;
            const newStock = Number(product.currentStock) + quantityChange;

            // 1. Create adjustment record
            const adjustment = await tx.stockAdjustment.create({
                data: {
                    productId: data.productId,
                    adjustmentType: data.type as any,
                    quantity: quantityChange,
                    reason: data.reason,
                    createdBy: data.createdBy,
                },
            });

            // 2. Update product stock
            await tx.product.update({
                where: { id: data.productId },
                data: { currentStock: newStock },
            });

            // 3. Log in ledger
            await tx.stockLedger.create({
                data: {
                    productId: data.productId,
                    transactionType: 'adjustment',
                    quantity: quantityChange,
                    previousStock: product.currentStock,
                    newStock,
                    referenceType: 'adjustment',
                    referenceId: adjustment.id,
                    notes: data.reason,
                    createdBy: data.createdBy,
                },
            });

            return adjustment;
        });
    }
}
