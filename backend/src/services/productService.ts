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
                    defaultLocation: true,
                    salesRep: true,
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
        const { category, ...rest } = data;
        let categoryId = data.categoryId;

        // Resolve category name to ID if needed
        if (!categoryId && category) {
            const foundCategory = await prisma.productCategory.findFirst({
                where: {
                    OR: [
                        { name: { contains: category, mode: 'insensitive' } },
                        { id: typeof category === 'string' && category.length === 36 ? category : undefined }
                    ].filter(Boolean) as any
                }
            });
            if (foundCategory) {
                categoryId = foundCategory.id;
            } else {
                const newCategory = await prisma.productCategory.create({
                    data: { name: category }
                });
                categoryId = newCategory.id;
            }
        }

        // Final fallback if no category is found/provided
        if (!categoryId) {
            const firstCategory = await prisma.productCategory.findFirst();
            if (firstCategory) categoryId = firstCategory.id;
            else throw new Error('No product categories available. Please create a category first.');
        }

        // Clean data for Prisma (remove frontend-only fields)
        const { quantity, lowStockThreshold, ...prismaData } = rest;

        return prisma.product.create({
            data: {
                name: prismaData.name,
                sku: prismaData.sku,
                barcode: prismaData.barcode,
                description: prismaData.description,
                unit: prismaData.unit || 'unit',
                costPrice: Number(prismaData.costPrice) || 0,
                sellingPrice: Number(prismaData.sellingPrice) || 0,
                wholesalePrice: prismaData.wholesalePrice ? Number(prismaData.wholesalePrice) : null,
                currentStock: Number(quantity) || 0,
                minStockLevel: Number(lowStockThreshold) || 10,
                isActive: true,
                categoryId,
                createdBy,
                // New ERP Fields
                defaultLocationId: prismaData.defaultLocationId,
                isTaxInclusive: prismaData.isTaxInclusive ?? false,
                reservedQuantity: Number(prismaData.reservedQuantity) || 0,
                bonusQuantity: Number(prismaData.bonusQuantity) || 0,
                packingUnit: prismaData.packingUnit,
                packingSize: prismaData.packingSize !== undefined ? Number(prismaData.packingSize) : undefined,
                salesRepId: prismaData.salesRepId,
                expiryDate: prismaData.expiryDate ? new Date(prismaData.expiryDate) : undefined,
                status: prismaData.status || 'draft',
            },
            include: {
                category: true,
                defaultLocation: true,
                salesRep: true,
            }
        });
    }

    // Update product
    static async updateProduct(id: string, data: any) {
        const { quantity, lowStockThreshold, category, categoryId, ...rest } = data;

        const updateData: any = {
            ...rest,
            costPrice: rest.costPrice !== undefined ? Number(rest.costPrice) : undefined,
            sellingPrice: rest.sellingPrice !== undefined ? Number(rest.sellingPrice) : undefined,
            wholesalePrice: rest.wholesalePrice !== undefined ? (rest.wholesalePrice === null ? null : Number(rest.wholesalePrice)) : undefined,
            currentStock: quantity !== undefined ? Number(quantity) : undefined,
            minStockLevel: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
        };

        if (categoryId) updateData.categoryId = categoryId;

        // Map and clean new ERP fields
        if (rest.isTaxInclusive !== undefined) updateData.isTaxInclusive = rest.isTaxInclusive;
        if (rest.reservedQuantity !== undefined) updateData.reservedQuantity = Number(rest.reservedQuantity);
        if (rest.bonusQuantity !== undefined) updateData.bonusQuantity = Number(rest.bonusQuantity);
        if (rest.packingUnit !== undefined) updateData.packingUnit = rest.packingUnit;
        if (rest.packingSize !== undefined) updateData.packingSize = Number(rest.packingSize);
        if (rest.defaultLocationId !== undefined) updateData.defaultLocationId = rest.defaultLocationId;
        if (rest.salesRepId !== undefined) updateData.salesRepId = rest.salesRepId;
        if (rest.expiryDate !== undefined) updateData.expiryDate = rest.expiryDate ? new Date(rest.expiryDate) : null;
        if (rest.status !== undefined) updateData.status = rest.status;

        return prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                defaultLocation: true,
                salesRep: true,
            },
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
