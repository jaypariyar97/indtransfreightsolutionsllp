import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Props {
  children: ReactNode;
  /** Restrict route to a specific role. Admin always passes. */
  requiredRole?: 'ADMIN' | 'EMPLOYEE';
  /**
   * Restrict route to users with a specific permission, e.g.
   * {@code requiredPermission={{ module: 'customers', action: 'view' }}}.
   * Admin always passes. If omitted, only authentication is required.
   */
  requiredPermission?: { module: string; action: string };
}

/**
 * Guard for every protected route.
 *
 *   loading                                -> spinner
 *   not authenticated                      -> /admin/login
 *   mustChangePassword                     -> /admin/change-password
 *   role mismatch                          -> /dashboard
 *   missing permission                     -> /dashboard (with toast)
 *   otherwise                              -> render children
 */
export default function PrivateRoute({ children, requiredRole, requiredPermission }: Props) {
  const { isAuthenticated, user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const mustChange = !!user.mustChangePassword;
  const onChangePasswordPage = location.pathname === '/admin/change-password';
  if (mustChange && !onChangePasswordPage) {
    return <Navigate to="/admin/change-password" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
