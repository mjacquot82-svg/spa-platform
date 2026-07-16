import type { ReactNode } from 'react';

import { useAuth } from './useAuth';

export interface ProtectedRouteProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  unauthenticatedFallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  loadingFallback = null,
  unauthenticatedFallback = null,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <>{loadingFallback}</>;
  if (!user) return <>{unauthenticatedFallback}</>;

  return <>{children}</>;
}
