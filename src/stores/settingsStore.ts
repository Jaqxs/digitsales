import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    business: {
        name: string;
        tradingName: string;
        tin: string;
        vatNumber: string;
        phone: string;
        email: string;
        address: string;
        currency: string;
        vatRate: number;
        logo?: string;
    };
    notifications: {
        lowStock: boolean;
        dailySales: boolean;
        newOrders: boolean;
        smsAlerts: boolean;
    };
    pos: {
        autoPrint: boolean;
        includeVat: boolean;
        requireCustomer: boolean;
        defaultPayment: string;
    };
    security: {
        twoFactor: boolean;
        sessionTimeout: string;
        auditLogging: boolean;
    };
    updateBusiness: (settings: Partial<SettingsState['business']>) => void;
    updateNotifications: (settings: Partial<SettingsState['notifications']>) => void;
    updatePos: (settings: Partial<SettingsState['pos']>) => void;
    updateSecurity: (settings: Partial<SettingsState['security']>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            business: {
                name: 'Zantrix Group Limited',
                tradingName: 'Zantrix Hardware & Construction',
                tin: '123-456-789',
                vatNumber: 'VAT-TZ-2024-001',
                phone: '+255 22 123 4567',
                email: 'info@zantrix.co.tz',
                address: 'Posta Street, Kariakoo, Dar es Salaam, Tanzania',
                currency: 'TZS',
                vatRate: 18,
            },
            notifications: {
                lowStock: true,
                dailySales: true,
                newOrders: true,
                smsAlerts: false,
            },
            pos: {
                autoPrint: true,
                includeVat: true,
                requireCustomer: false,
                defaultPayment: 'cash',
            },
            security: {
                twoFactor: false,
                sessionTimeout: '30',
                auditLogging: true,
            },
            updateBusiness: (updates) =>
                set((state) => ({ business: { ...state.business, ...updates } })),
            updateNotifications: (updates) =>
                set((state) => ({ notifications: { ...state.notifications, ...updates } })),
            updatePos: (updates) =>
                set((state) => ({ pos: { ...state.pos, ...updates } })),
            updateSecurity: (updates) =>
                set((state) => ({ security: { ...state.security, ...updates } })),
        }),
        {
            name: 'zantrix-settings',
        }
    )
);
