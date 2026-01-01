import { User, Employee, UserRole } from '@/types/pos';

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
        phone: profile?.phone || '',
        avatar: profile?.avatarUrl || undefined,
        salesTarget: 0,
        totalSales: 0,
        commission: 0,
        createdAt: new Date(apiUser.createdAt || Date.now()),
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
