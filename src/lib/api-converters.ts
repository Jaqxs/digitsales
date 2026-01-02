import { User, Employee, UserRole, Product, Customer, Sale } from '@/types/pos';

export const mapApiUserToEmployee = (apiUser: any): Employee => {
    if (!apiUser) {
        return {
            id: 'unknown',
            name: 'Unknown User',
            email: '',
            role: 'sales',
            phone: '',
            salesTarget: 0,
            totalSales: 0,
            commission: 0,
            createdAt: new Date(),
        };
    }
    const profile = apiUser.profile || apiUser.userProfile;
    return {
        id: apiUser.id || 'unknown',
        name: profile
            ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || apiUser.email
            : apiUser.email || 'User',
        email: apiUser.email || '',
        role: (apiUser.role?.toLowerCase() as UserRole) || 'sales',
        phone: profile?.phone || apiUser.phone || '', // Check both locations
        avatar: profile?.avatarUrl || undefined,
        salesTarget: Number(apiUser.salesTarget) || 0,
        totalSales: Number(apiUser.totalSales) || 0,
        commission: Number(apiUser.commission) || 0,
        createdAt: new Date(apiUser.createdAt || Date.now()),
    };
};

export const mapApiProductToProduct = (apiProduct: any): Product => {
    if (!apiProduct) return {} as Product;

    return {
        id: apiProduct.id,
        name: apiProduct.name,
        sku: apiProduct.sku,
        barcode: apiProduct.barcode,
        category: apiProduct.category?.name || apiProduct.categoryId,
        description: apiProduct.description,
        costPrice: Number(apiProduct.costPrice),
        sellingPrice: Number(apiProduct.sellingPrice),
        quantity: Number(apiProduct.currentStock), // Map currentStock to quantity
        lowStockThreshold: Number(apiProduct.minStockLevel),
        supplier: apiProduct.supplier?.name || '',
        unit: apiProduct.unit || 'unit',
        imageUrl: apiProduct.imageUrl,
        createdAt: new Date(apiProduct.createdAt),
        updatedAt: new Date(apiProduct.updatedAt),
    };
};

export const mapApiCustomerToCustomer = (apiCustomer: any): Customer => {
    if (!apiCustomer) return {} as Customer;

    return {
        ...apiCustomer,
        name: apiCustomer.name || `${apiCustomer.firstName || ''} ${apiCustomer.lastName || ''}`.trim() || 'Unnamed Customer',
        loyaltyPoints: Number(apiCustomer.loyaltyPoints) || 0,
        totalPurchases: Number(apiCustomer.totalPurchases) || 0,
        createdAt: new Date(apiCustomer.createdAt),
    };
};

export const mapApiUserToUser = (apiUser: any): User => {
    if (!apiUser) {
        return {
            id: 'unknown',
            name: 'Unknown User',
            email: '',
            role: 'sales',
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    const profile = apiUser.profile || apiUser.userProfile;
    return {
        id: apiUser.id || 'unknown',
        name: profile
            ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || apiUser.email
            : apiUser.email || 'User',
        email: apiUser.email || '',
        role: (apiUser.role?.toLowerCase() as UserRole) || 'sales',
        avatar: profile?.avatarUrl || undefined,
        isActive: apiUser.isActive ?? true,
        lastLoginAt: apiUser.lastLoginAt,
        profile: profile ? {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phone: profile.phone,
            avatarUrl: profile.avatarUrl,
            employeeId: profile.employeeId,
        } : null,
        createdAt: apiUser.createdAt || new Date().toISOString(),
        updatedAt: apiUser.updatedAt || new Date().toISOString(),
    };
};
export const mapApiSaleToSale = (apiSale: any): Sale => {
    if (!apiSale) return {} as Sale;

    return {
        ...apiSale,
        items: apiSale.saleItems || [],
        subtotal: Number(apiSale.subtotal),
        discount: Number(apiSale.discountAmount),
        vat: Number(apiSale.taxAmount),
        total: Number(apiSale.totalAmount),
        paymentMethod: apiSale.paymentMethod === 'bank_transfer' ? 'bank-transfer' : apiSale.paymentMethod,
        createdAt: new Date(apiSale.createdAt),
    };
};
