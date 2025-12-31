import { prisma } from '../config/database';

export class CustomerService {
    static async getAllCustomers(options?: {
        page?: number;
        limit?: number;
        search?: string;
        isActive?: boolean;
    }) {
        const {
            page = 1,
            limit = 10,
            search,
            isActive,
        } = options || {};

        const skip = (page - 1) * limit;
        const where: any = {};

        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { companyName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.customer.count({ where }),
        ]);

        return {
            customers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    static async getCustomerById(id: string) {
        return prisma.customer.findUnique({
            where: { id },
            include: {
                sales: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }

    static async createCustomer(data: any, createdBy: string) {
        return prisma.customer.create({
            data: {
                ...data,
                createdBy,
            },
        });
    }

    static async updateCustomer(id: string, data: any) {
        return prisma.customer.update({
            where: { id },
            data,
        });
    }

    static async deleteCustomer(id: string) {
        return prisma.customer.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
