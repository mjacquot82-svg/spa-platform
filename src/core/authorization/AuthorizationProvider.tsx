import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { AuthorizationContext } from './AuthorizationContext';
import type { AuthorizationContextValue } from './AuthorizationContext';
import {
  canPermission,
  hasAllPermissions,
  hasAnyPermission,
} from './evaluation';
import type { PermissionResolutionService } from './permission-resolution.service';
import type { PermissionKey } from './types';

export interface AuthorizationProviderProps extends PropsWithChildren {
  membershipId: string | null;
  resolutionService: PermissionResolutionService;
}

export function AuthorizationProvider({
  children,
  membershipId,
  resolutionService,
}: AuthorizationProviderProps) {
  const [permissionKeys, setPermissionKeys] = useState<ReadonlySet<PermissionKey>>(new Set());
  const [loading, setLoading] = useState(Boolean(membershipId));
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const resolve = useCallback(async (force: boolean) => {
    const requestId = ++requestIdRef.current;
    if (!membershipId) {
      setPermissionKeys(new Set());
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snapshot = await resolutionService.resolve(membershipId, force);
      if (requestId !== requestIdRef.current) return;
      setPermissionKeys(snapshot.permissionKeys);
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      setPermissionKeys(new Set());
      setError(toError(cause));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [membershipId, resolutionService]);

  useEffect(() => {
    setPermissionKeys(new Set());
    void resolve(false);
  }, [resolve]);

  const can = useCallback(
    (permissionKey: PermissionKey) => canPermission(permissionKeys, permissionKey),
    [permissionKeys],
  );
  const hasAny = useCallback(
    (keys: readonly PermissionKey[]) => hasAnyPermission(permissionKeys, keys),
    [permissionKeys],
  );
  const hasAll = useCallback(
    (keys: readonly PermissionKey[]) => hasAllPermissions(permissionKeys, keys),
    [permissionKeys],
  );
  const refresh = useCallback(() => resolve(true), [resolve]);

  const value = useMemo<AuthorizationContextValue>(
    () => ({
      membershipId,
      permissionKeys,
      loading,
      error,
      can,
      hasAny,
      hasAll,
      refresh,
    }),
    [can, error, hasAll, hasAny, loading, membershipId, permissionKeys, refresh],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error('Permission resolution failed.');
}
