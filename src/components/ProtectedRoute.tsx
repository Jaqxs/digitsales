import { UserRole } from '@/contexts/AuthContext';

// ─── PREVIEW MODE: All routes accessible, no authentication required ──────────

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  routeName?: string;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
