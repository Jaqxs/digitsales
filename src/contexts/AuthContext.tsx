import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import { User, UserRole } from '@/types/pos';
import { useSettingsStore } from '@/stores/settingsStore';

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
  const [user, setUser] = useState<User | null>({
    id: 'preview-admin',
    name: 'Preview Admin',
    email: 'admin@zantrix.co.tz',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Preview mode: always logged in as admin
  }, []);

  const login = async (email: string, password: string) => {
    // Basic mock local login
    const savedUser = localStorage.getItem('zantrix-user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.email === email && password === localStorage.getItem('zantrix-password')) {
        setUser(parsed);
        return { success: true };
      }
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
    
    // Save to local storage for persistence
    localStorage.setItem('zantrix-user', JSON.stringify(newUser));
    localStorage.setItem('zantrix-password', data.password); // MOCK ONLY
    setUser(newUser);

    if (data.companyName) {
      useSettingsStore.getState().updateBusiness({ name: data.companyName, tradingName: data.companyName });
    }

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('zantrix-user');
    setUser(null);
  };

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
  admin: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports', 'settings', 'system-logs', 'stock-movement'],
  manager: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports', 'stock-movement'],
  sales: ['dashboard', 'pos', 'customers', 'sales'],
  inventory: ['dashboard', 'inventory', 'stock-movement'],
  support: ['dashboard', 'customers'],
  stock_keeper: ['dashboard', 'inventory', 'stock-movement'],
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  return rolePermissions[role]?.includes(route) || false;
};

