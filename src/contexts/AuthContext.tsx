import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { type User as ApiUser } from '../lib/api/auth';
import { LocalAuthService } from '@/services/localAuth';

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

// Convert API user to context user
const convertApiUserToContextUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser.id,
    name: apiUser.profile
      ? `${apiUser.profile.firstName} ${apiUser.profile.lastName}`
      : apiUser.email,
    email: apiUser.email,
    role: apiUser.role as UserRole,
    avatar: apiUser.profile?.avatarUrl || undefined,
    isActive: apiUser.isActive,
    lastLoginAt: apiUser.lastLoginAt,
    profile: apiUser.profile ? {
      firstName: apiUser.profile.firstName || '',
      lastName: apiUser.profile.lastName || '',
      phone: apiUser.profile.phone,
      avatarUrl: apiUser.profile.avatarUrl,
      employeeId: apiUser.profile.employeeId,
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
    // Check for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Verify session by fetching current user from local storage
          const apiUser = await LocalAuthService.getCurrentUser();
          const contextUser = convertApiUserToContextUser(apiUser);
          setUser(contextUser);
        } catch (error) {
          // Token is invalid or expired
          console.error('Auth check failed:', error);
          LocalAuthService.logout();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const authResponse = await LocalAuthService.login({ email, password });
      const contextUser = convertApiUserToContextUser(authResponse.user);
      setUser(contextUser);
      return { success: true };
    } catch (error: any) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    LocalAuthService.logout();
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
  admin: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports', 'settings', 'system-logs'],
  manager: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports'],
  sales: ['dashboard', 'pos', 'customers'],
  inventory: ['dashboard', 'inventory'],
  support: ['dashboard', 'customers'],
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  return rolePermissions[role]?.includes(route) ?? false;
};
