import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import { User, UserRole } from '@/types/pos';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDataStore } from '@/stores/dataStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; companyName?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('digitsales-current-user');
    if (saved) return JSON.parse(saved);
    
    // Default to a mock admin user for immediate preview/access
    const defaultUser = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@digitsales.com',
      role: 'admin' as UserRole,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    // Also save it to accounts list so they can log back in if they log out
    try {
      const savedAccounts = JSON.parse(localStorage.getItem('digitsales-accounts') || '[]');
      if (!savedAccounts.some((acc: any) => acc.email === defaultUser.email)) {
        savedAccounts.push({
          email: defaultUser.email,
          password: 'admin',
          user: defaultUser,
          company: 'Digitsales POS'
        });
        localStorage.setItem('digitsales-accounts', JSON.stringify(savedAccounts));
      }
    } catch (e) {
      console.error('Failed to initialize mock accounts:', e);
    }
    
    localStorage.setItem('digitsales-current-user', JSON.stringify(defaultUser));
    return defaultUser;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sync current user to localStorage when it changes
    if (user) {
      localStorage.setItem('digitsales-current-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('digitsales-current-user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    // Basic mock local login with multiple accounts support
    const savedAccounts = JSON.parse(localStorage.getItem('digitsales-accounts') || '[]');
    const account = savedAccounts.find((acc: any) => acc.email === email && acc.password === password);
    
    if (account) {
      setUser(account.user);
      return { success: true };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const register = async (data: any) => {
    const newUser: User = {
      id: `admin-${Date.now()}`,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    // Save to a list of accounts for multi-user simulation
    const savedAccounts = JSON.parse(localStorage.getItem('digitsales-accounts') || '[]');
    
    if (savedAccounts.some((acc: any) => acc.email === data.email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    savedAccounts.push({
      email: data.email,
      password: data.password,
      user: newUser,
      company: data.companyName
    });

    localStorage.setItem('digitsales-accounts', JSON.stringify(savedAccounts));
    setUser(newUser);

    if (data.companyName) {
      // For initial setup, we update the settings store
      useSettingsStore.getState().updateBusiness({ 
        name: data.companyName, 
        tradingName: data.companyName,
        email: data.email
      });
    }

    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  useEffect(() => {
    // Sync stores with current user for isolation
    if (user?.id) {
      useSettingsStore.getState().setCurrentUser(user.id);
      useDataStore.getState().setCurrentUser(user.id);
    } else {
      useSettingsStore.getState().setCurrentUser(null);
      useDataStore.getState().setCurrentUser(null);
    }
  }, [user]);

  const hasPermission = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role permissions mapping
export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['dashboard', 'pos', 'inventory', 'sales', 'expenses', 'customers', 'employees', 'reports', 'settings', 'system-logs', 'stock-movement', 'subscription'],
  manager: ['dashboard', 'pos', 'inventory', 'sales', 'expenses', 'customers', 'employees', 'reports', 'stock-movement'],
  sales: ['dashboard', 'pos', 'customers', 'sales'],
  inventory: ['dashboard', 'inventory', 'stock-movement'],
  support: ['dashboard', 'customers'],
  stock_keeper: ['dashboard', 'inventory', 'stock-movement'],
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  return rolePermissions[role]?.includes(route) || false;
};

