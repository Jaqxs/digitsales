import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types/pos';
import { useSettingsStore } from '@/stores/settingsStore';
import { useDataStore } from '@/stores/dataStore';
import { authAPI } from '@/services/api';

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

// Map backend user to frontend User shape
function mapBackendUser(backendUser: any): User {
  return {
    id: backendUser.id,
    name: `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim() || backendUser.email,
    email: backendUser.email,
    role: (backendUser.role?.toLowerCase() || 'admin') as UserRole,
    isActive: backendUser.isActive ?? true,
    createdAt: backendUser.createdAt || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading while we verify the session

  // On mount, check if we have a stored token and verify with backend
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('digitsales_token');
      if (!token) {
        // No token — check legacy localStorage user for backwards compat
        const saved = localStorage.getItem('digitsales-current-user');
        if (saved) {
          try {
            setUser(JSON.parse(saved));
          } catch {
            /* ignore */
          }
        }
        setIsLoading(false);
        return;
      }

      try {
        const data = await authAPI.getCurrentUser();
        const mappedUser = mapBackendUser(data.user || data);
        setUser(mappedUser);
      } catch {
        // Token is invalid / expired — clear it
        localStorage.removeItem('digitsales_token');
        localStorage.removeItem('digitsales_refreshToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sync user to localStorage + stores
  useEffect(() => {
    if (user) {
      localStorage.setItem('digitsales-current-user', JSON.stringify(user));
      useSettingsStore.getState().setCurrentUser(user.id);
      useDataStore.getState().setCurrentUser(user.id);
    } else {
      localStorage.removeItem('digitsales-current-user');
      useSettingsStore.getState().setCurrentUser(null);
      useDataStore.getState().setCurrentUser(null);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Try real backend first
      const data = await authAPI.login(email, password);
      if (data.tokens?.accessToken) {
        localStorage.setItem('digitsales_token', data.tokens.accessToken);
        if (data.tokens.refreshToken) {
          localStorage.setItem('digitsales_refreshToken', data.tokens.refreshToken);
        }
      }
      const mappedUser = mapBackendUser(data.user);
      setUser(mappedUser);
      return { success: true };
    } catch (err: any) {
      // If backend is unreachable, fall back to localStorage accounts
      if (err.message?.includes('Network error') || err.message?.includes('Cannot connect')) {
        console.warn('⚠️ Backend unreachable — falling back to local accounts');
        const savedAccounts = JSON.parse(localStorage.getItem('digitsales-accounts') || '[]');
        const account = savedAccounts.find((acc: any) => acc.email === email && acc.password === password);
        if (account) {
          setUser(account.user);
          return { success: true };
        }
        return { success: false, error: 'Invalid email or password.' };
      }
      return { success: false, error: err.message || 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: any) => {
    setIsLoading(true);
    try {
      // Try real backend first
      const result = await authAPI.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      if (result.tokens?.accessToken) {
        localStorage.setItem('digitsales_token', result.tokens.accessToken);
        if (result.tokens.refreshToken) {
          localStorage.setItem('digitsales_refreshToken', result.tokens.refreshToken);
        }
      }

      const mappedUser = mapBackendUser(result.user);
      setUser(mappedUser);

      if (data.companyName) {
        useSettingsStore.getState().updateBusiness({
          name: data.companyName,
          tradingName: data.companyName,
          email: data.email,
        });
      }

      return { success: true };
    } catch (err: any) {
      // Fallback: create local account
      if (err.message?.includes('Network error') || err.message?.includes('Cannot connect')) {
        console.warn('⚠️ Backend unreachable — creating local account');
        const newUser: User = {
          id: `local-${Date.now()}`,
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          role: 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        const savedAccounts = JSON.parse(localStorage.getItem('digitsales-accounts') || '[]');
        if (savedAccounts.some((acc: any) => acc.email === data.email)) {
          return { success: false, error: 'An account with this email already exists.' };
        }
        savedAccounts.push({ email: data.email, password: data.password, user: newUser, company: data.companyName });
        localStorage.setItem('digitsales-accounts', JSON.stringify(savedAccounts));
        setUser(newUser);
        if (data.companyName) {
          useSettingsStore.getState().updateBusiness({ name: data.companyName, tradingName: data.companyName, email: data.email });
        }
        return { success: true };
      }
      return { success: false, error: err.message || 'Registration failed.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('digitsales_token');
    localStorage.removeItem('digitsales_refreshToken');
    setUser(null);
  }, []);

  const hasPermission = useCallback((allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  }, [user]);

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
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
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
