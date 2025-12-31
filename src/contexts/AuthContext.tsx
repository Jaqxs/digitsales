import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';

export type UserRole = 'admin' | 'manager' | 'sales' | 'inventory' | 'support';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  // Additional fields from backend
  isActive?: boolean;
  lastLoginAt?: string | null;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    avatarUrl?: string | null;
    employeeId?: string | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: 'zantrix_token',
  USER: 'zantrix_user',
};

// Convert API user to context user
const convertApiUserToContextUser = (apiUser: any): User => {
  return {
    id: apiUser.id,
    name: apiUser.userProfile
      ? `${apiUser.userProfile.firstName} ${apiUser.userProfile.lastName}`
      : apiUser.email,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    avatar: apiUser.userProfile?.avatarUrl || undefined,
    isActive: apiUser.isActive,
    lastLoginAt: apiUser.lastLoginAt,
    profile: apiUser.userProfile ? {
      firstName: apiUser.userProfile.firstName || '',
      lastName: apiUser.userProfile.lastName || '',
      phone: apiUser.userProfile.phone,
      avatarUrl: apiUser.userProfile.avatarUrl,
      employeeId: apiUser.userProfile.employeeId,
    } : null,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          const response = await api.auth.getCurrentUser();
          const contextUser = convertApiUserToContextUser(response.user);
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
      const contextUser = convertApiUserToContextUser(response.user);

      localStorage.setItem(STORAGE_KEYS.TOKEN, response.tokens.accessToken);
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

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
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
  admin: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports', 'settings', 'system-logs'],
  manager: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports'],
  sales: ['dashboard', 'pos', 'customers'],
  inventory: ['dashboard', 'inventory'],
  support: ['dashboard', 'customers'],
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  return rolePermissions[role]?.includes(route) ?? false;
};
