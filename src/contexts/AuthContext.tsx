import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

import { User, UserRole } from '@/types/pos';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: 'zantrix_token',
  USER: 'zantrix_user',
};

import { mapApiUserToUser } from '@/lib/api-converters';

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("AuthProvider: Rendering");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthProvider: Running checkAuth effect");
    const checkAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          const response = await api.auth.getCurrentUser();
          const contextUser = mapApiUserToUser(response.user);
          setUser(contextUser);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(contextUser));
        } catch (error) {
          console.error('Session verification failed:', error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await api.auth.login(email, password);
      const contextUser = mapApiUserToUser(response.user);

      localStorage.setItem(STORAGE_KEYS.TOKEN, response.tokens.accessToken);
      if (response.tokens.refreshToken) {
        localStorage.setItem('zantrix_refreshToken', response.tokens.refreshToken);
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(contextUser));

      setUser(contextUser);
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message || 'Invalid credentials'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const response = await api.auth.register(data);
      const contextUser = mapApiUserToUser(response.user);

      localStorage.setItem(STORAGE_KEYS.TOKEN, response.tokens.accessToken);
      if (response.tokens.refreshToken) {
        localStorage.setItem('zantrix_refreshToken', response.tokens.refreshToken);
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(contextUser));

      setUser(contextUser);
      return { success: true };
    } catch (error: any) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem('zantrix_refreshToken');
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    navigate('/auth');
  };

  const hasPermission = (allowedRoles: UserRole[]): boolean => {
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
      logout: handleLogout,
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
  return rolePermissions[role]?.includes(route) ?? false;
};
