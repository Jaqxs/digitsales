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
        // Resolve category
        let categoryId = data.categoryId;
        const categoryInput = data.category;

        if (!categoryId && categoryInput) {
            const foundCategory = await prisma.productCategory.findFirst({
                where: {
                    OR: [
                        { name: { contains: categoryInput, mode: 'insensitive' } },
                        { id: typeof categoryInput === 'string' && categoryInput.length === 36 ? categoryInput : undefined }
                    ].filter(Boolean) as any
                }
            });
            if (foundCategory) {
                categoryId = foundCategory.id;
            } else {
                const newCategory = await prisma.productCategory.create({
                    data: { name: categoryInput }
                });
                categoryId = newCategory.id;
            }
        }

        if (!categoryId) {
            const firstCategory = await prisma.productCategory.findFirst();
            if (firstCategory) categoryId = firstCategory.id;
            else throw new Error('No product categories available. Please create a category first.');
        }

        return prisma.product.create({
            data: {
                name: data.name,
                sku: data.sku,
                barcode: data.barcode || null,
                description: data.description || null,
                unit: data.unit || 'unit',
                costPrice: Number(data.costPrice) || 0,
                sellingPrice: Number(data.sellingPrice) || 0,
                wholesalePrice: (data.wholesalePrice === null || data.wholesalePrice === undefined || data.wholesalePrice === '') ? null : Number(data.wholesalePrice),
                currentStock: Number(data.quantity) || 0,
                minStockLevel: Number(data.lowStockThreshold) || 0,
                isActive: true,
                categoryId: categoryId,
                createdBy: createdBy,
                // ERP Fields
                defaultLocationId: data.defaultLocationId || null,
                isTaxInclusive: data.isTaxInclusive ?? false,
                taxRate: data.taxRate !== undefined ? Number(data.taxRate) : 18.00,
                reservedQuantity: Number(data.reservedQuantity) || 0,
                bonusQuantity: Number(data.bonusQuantity) || 0,
                packingUnit: data.packingUnit || null,
                packingSize: (data.packingSize === null || data.packingSize === undefined || data.packingSize === '') ? null : Number(data.packingSize),
                salesRepId: data.salesRepId || null,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                status: data.status || 'approved',
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
        // Resolve category if changing
        let categoryId = data.categoryId;
        const categoryInput = data.category;

        if (!categoryId && categoryInput) {
            const foundCategory = await prisma.productCategory.findFirst({
                where: {
                    OR: [
                        { name: { contains: categoryInput, mode: 'insensitive' } },
                        { id: typeof categoryInput === 'string' && categoryInput.length === 36 ? categoryInput : undefined }
                    ].filter(Boolean) as any
                }
            });
            if (foundCategory) categoryId = foundCategory.id;
        }

        const updateData: any = {};

        const setNum = (val: any) => (val !== undefined && val !== null && val !== '') ? Number(val) : undefined;
        const setNullNum = (val: any) => (val === null || val === '') ? null : (val !== undefined ? Number(val) : undefined);
        const setStr = (val: any) => val !== undefined ? val : undefined;
        const setNullStr = (val: any) => val !== undefined ? (val || null) : undefined;

        if (data.name !== undefined) updateData.name = setStr(data.name);
        if (data.sku !== undefined) updateData.sku = setStr(data.sku);
        if (data.barcode !== undefined) updateData.barcode = setNullStr(data.barcode);
        if (data.description !== undefined) updateData.description = setNullStr(data.description);
        if (data.unit !== undefined) updateData.unit = setStr(data.unit);

        if (data.costPrice !== undefined) updateData.costPrice = setNum(data.costPrice);
        if (data.sellingPrice !== undefined) updateData.sellingPrice = setNum(data.sellingPrice);
        if (data.wholesalePrice !== undefined) updateData.wholesalePrice = setNullNum(data.wholesalePrice);

        if (data.quantity !== undefined) updateData.currentStock = setNum(data.quantity);
        if (data.lowStockThreshold !== undefined) updateData.minStockLevel = setNum(data.lowStockThreshold);

        if (categoryId) updateData.categoryId = categoryId;

        if (data.isTaxInclusive !== undefined) updateData.isTaxInclusive = !!data.isTaxInclusive;
        if (data.taxRate !== undefined) updateData.taxRate = setNum(data.taxRate);
        if (data.reservedQuantity !== undefined) updateData.reservedQuantity = setNum(data.reservedQuantity);
        if (data.bonusQuantity !== undefined) updateData.bonusQuantity = setNum(data.bonusQuantity);
        if (data.packingUnit !== undefined) updateData.packingUnit = setNullStr(data.packingUnit);
        if (data.packingSize !== undefined) updateData.packingSize = setNullNum(data.packingSize);

        if (data.defaultLocationId !== undefined) updateData.defaultLocationId = setNullStr(data.defaultLocationId);
        if (data.salesRepId !== undefined) updateData.salesRepId = setNullStr(data.salesRepId);
        if (data.status !== undefined) updateData.status = setStr(data.status);

        if (data.expiryDate !== undefined) {
            updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
        }

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
