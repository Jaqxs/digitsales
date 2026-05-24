import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsData {
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
        accountNumber?: string;
        bankName?: string;
        branchName?: string;
        website?: string;
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
    categories: string[];
}

interface MultiUserSettingsState {
    business: SettingsData['business'];
    notifications: SettingsData['notifications'];
    pos: SettingsData['pos'];
    security: SettingsData['security'];
    categories: string[];
    
    currentUserId: string | null;
    userSettings: Record<string, SettingsData>;
    
    setCurrentUser: (userId: string | null) => void;
    updateBusiness: (settings: Partial<SettingsData['business']>) => void;
    updateNotifications: (settings: Partial<SettingsData['notifications']>) => void;
    updatePos: (settings: Partial<SettingsData['pos']>) => void;
    updateSecurity: (settings: Partial<SettingsData['security']>) => void;
    addCategory: (category: string) => void;
    removeCategory: (category: string) => void;
}

const DEFAULT_SETTINGS: SettingsData = {
    business: {
        name: 'Digitsales POS',
        tradingName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        tin: '',
        vatNumber: '',
        accountNumber: '',
        bankName: '',
        branchName: '',
        logo: '',
        currency: 'TZS',
        vatRate: 18
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
    categories: ['General', 'Electronics', 'Clothing', 'Food & Beverages', 'Health & Beauty', 'Home & Garden', 'Sports & Outdoors', 'Toys & Games'],
};

export const useSettingsStore = create<MultiUserSettingsState>()(
  persist(
    (set, get) => ({
    ...DEFAULT_SETTINGS,
    currentUserId: null,
    userSettings: {},

    setCurrentUser: (userId) => {
        if (!userId) {
            set({ currentUserId: null, ...DEFAULT_SETTINGS });
            return;
        }
        const { userSettings } = get();
        const settings = userSettings[userId] || DEFAULT_SETTINGS;
        set({ 
            currentUserId: userId,
            business: settings.business,
            notifications: settings.notifications,
            pos: settings.pos,
            security: settings.security,
            categories: settings.categories || DEFAULT_SETTINGS.categories,
        });
    },

    updateBusiness: (updates) => {
        set((state) => {
            const newBusiness = { ...state.business, ...updates };
            const newState = { ...state, business: newBusiness };
            if (state.currentUserId) {
                newState.userSettings = {
                    ...state.userSettings,
                    [state.currentUserId]: {
                        business: newBusiness,
                        notifications: state.notifications,
                        pos: state.pos,
                        security: state.security
                    }
                };
            }
            return newState;
        });
    },

    updateNotifications: (updates) => {
        set((state) => {
            const newNotifications = { ...state.notifications, ...updates };
            const newState = { ...state, notifications: newNotifications };
            if (state.currentUserId) {
                newState.userSettings = {
                    ...state.userSettings,
                    [state.currentUserId]: {
                        business: state.business,
                        notifications: newNotifications,
                        pos: state.pos,
                        security: state.security
                    }
                };
            }
            return newState;
        });
    },

    updatePos: (updates) => {
        set((state) => {
            const newPos = { ...state.pos, ...updates };
            const newState = { ...state, pos: newPos };
            if (state.currentUserId) {
                newState.userSettings = {
                    ...state.userSettings,
                    [state.currentUserId]: {
                        business: state.business,
                        notifications: state.notifications,
                        pos: newPos,
                        security: state.security
                    }
                };
            }
            return newState;
        });
    },

    updateSecurity: (updates) => {
        set((state) => {
            const newSecurity = { ...state.security, ...updates };
            const newState = { ...state, security: newSecurity };
            if (state.currentUserId) {
                newState.userSettings = {
                    ...state.userSettings,
                    [state.currentUserId]: {
                        business: state.business,
                        notifications: state.notifications,
                        pos: state.pos,
                        security: newSecurity,
                        categories: state.categories,
                    }
                };
            }
            return newState;
        });
    },

    addCategory: (category: string) => {
        set((state) => {
            const trimmed = category.trim();
            if (!trimmed || state.categories.includes(trimmed)) return state;
            const newCategories = [...state.categories, trimmed];
            const newState = { ...state, categories: newCategories };
            if (state.currentUserId) {
                newState.userSettings = {
                    ...state.userSettings,
                    [state.currentUserId]: {
                        business: state.business,
                        notifications: state.notifications,
                        pos: state.pos,
                        security: state.security,
                        categories: newCategories,
                    }
                };
            }
            return newState;
        });
    },

    removeCategory: (category: string) => {
        set((state) => {
            const newCategories = state.categories.filter(c => c !== category);
            const newState = { ...state, categories: newCategories };
            if (state.currentUserId) {
                newState.userSettings = {
                    ...state.userSettings,
                    [state.currentUserId]: {
                        business: state.business,
                        notifications: state.notifications,
                        pos: state.pos,
                        security: state.security,
                        categories: newCategories,
                    }
                };
            }
            return newState;
        });
    },
  }),
  {
    name: 'digitsales-settings',
  }
)
);
