import { prisma } from '../config/database';
import { Product } from '@prisma/client';

export class ProductService {
    // Get all products
    static async getAllProducts(options?: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
        isActive?: boolean;
    }) {
        const {
            page = 1,
            limit = 10,
            search,
            categoryId,
            isActive,
        } = options || {};

        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // Get product by ID
    static async getProductById(id: string) {
        return prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                variants: true,
            },
        });
    }

    // Create product
    static async createProduct(data: any, createdBy: string) {
        return prisma.product.create({
            data: {
                ...data,
                createdBy,
            },
        });
    }

    // Update product
    static async updateProduct(id: string, data: any) {
        return prisma.product.update({
            where: { id },
            data,
        });
    }

    // Delete product
    static async deleteProduct(id: string) {
        return prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Update stock level
    static async updateStock(productId: string, quantityChange: number, createdBy: string, type: 'in' | 'out' | 'adjustment', reason: string) {
        return prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({
                where: { id: productId },
            });

            if (!product) throw new Error('Product not found');

            const newQuantity = Number(product.currentStock) + quantityChange;

            // Update product current stock
            const updatedProduct = await tx.product.update({
                where: { id: productId },
                data: { currentStock: newQuantity },
            });

            // Create stock ledger entry
            await tx.stockLedger.create({
                data: {
                    productId,
                    transactionType: type as any,
                    quantity: quantityChange,
                    previousStock: product.currentStock,
                    newStock: newQuantity,
                    notes: reason,
                    createdBy,
                },
            });

            return updatedProduct;
        });
    }
}
