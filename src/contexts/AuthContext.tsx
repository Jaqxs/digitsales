import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'admin' | 'manager' | 'sales' | 'inventory' | 'support';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
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

// Mock users for demo - in production, this would come from your backend
const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@zantrix.co.tz': {
    password: 'admin123',
    user: {
      id: '1',
      name: 'Amina Juma',
      email: 'admin@zantrix.co.tz',
      role: 'admin',
    },
  },
  'manager@zantrix.co.tz': {
    password: 'manager123',
    user: {
      id: '2',
      name: 'John Mwanga',
      email: 'manager@zantrix.co.tz',
      role: 'manager',
    },
  },
  'sales@zantrix.co.tz': {
    password: 'sales123',
    user: {
      id: '3',
      name: 'Grace Mushi',
      email: 'sales@zantrix.co.tz',
      role: 'sales',
    },
  },
  'inventory@zantrix.co.tz': {
    password: 'inventory123',
    user: {
      id: '4',
      name: 'Peter Kimaro',
      email: 'inventory@zantrix.co.tz',
      role: 'inventory',
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('zantrix_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('zantrix_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userRecord = mockUsers[email.toLowerCase()];
    
    if (!userRecord) {
      setIsLoading(false);
      return { success: false, error: 'User not found. Please check your email.' };
    }
    
    if (userRecord.password !== password) {
      setIsLoading(false);
      return { success: false, error: 'Invalid password. Please try again.' };
    }
    
    setUser(userRecord.user);
    localStorage.setItem('zantrix_user', JSON.stringify(userRecord.user));
    setIsLoading(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('zantrix_user');
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
  admin: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports', 'settings'],
  manager: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 'employees', 'reports'],
  sales: ['dashboard', 'pos', 'customers'],
  inventory: ['dashboard', 'inventory'],
  support: ['dashboard', 'customers'],
};

export const canAccessRoute = (role: UserRole, route: string): boolean => {
  return rolePermissions[role]?.includes(route) ?? false;
};
