import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole, canAccessRoute } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  routeName?: string;
}

export function ProtectedRoute({ children, allowedRoles, routeName }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check route-based permissions
  if (routeName && user && !canAccessRoute(user.role, routeName)) {
    return <Navigate to="/" replace />;
  }

  // Check role-based permissions
  if (allowedRoles && !hasPermission(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
