import { prisma } from '../config/database';

export class ReportService {
    // Sales summary by date
    static async getSalesSummary(startDate: Date, endDate: Date) {
        const sales = await prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
                status: 'completed',
            },
            select: {
                totalAmount: true,
                createdAt: true,
            },
        });

        // Group by date
        const summaryMap = new Map<string, number>();
        sales.forEach((sale) => {
            const date = sale.createdAt.toISOString().split('T')[0];
            summaryMap.set(date, (summaryMap.get(date) || 0) + Number(sale.totalAmount));
        });

        return Array.from(summaryMap.entries()).map(([date, total]) => ({
            date,
            total,
        }));
    }

    // Category performance
    static async getCategoryPerformance() {
        const categories = await prisma.productCategory.findMany({
            include: {
                products: {
                    include: {
                        saleItems: {
                            where: {
                                sale: { status: 'completed' },
                            },
                        },
                    },
                },
            },
        });

        return categories.map((cat) => {
            let totalRevenue = 0;
            let totalItems = 0;

            cat.products.forEach((prod) => {
                prod.saleItems.forEach((item) => {
                    totalRevenue += Number(item.lineTotal);
                    totalItems += Number(item.quantity);
                });
            });

            return {
                category: cat.name,
                revenue: totalRevenue,
                itemsSold: totalItems,
            };
        });
    }

    // Stock valuation
    static async getStockValuation() {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            select: {
                name: true,
                currentStock: true,
                costPrice: true,
                sellingPrice: true,
            },
        });

        let totalCostValuation = 0;
        let totalSellingValuation = 0;

        products.forEach((p) => {
            totalCostValuation += Number(p.currentStock) * Number(p.costPrice);
            totalSellingValuation += Number(p.currentStock) * Number(p.sellingPrice);
        });

        return {
            totalCost: totalCostValuation,
            totalSelling: totalSellingValuation,
            productCount: products.length,
        };
    }
}
