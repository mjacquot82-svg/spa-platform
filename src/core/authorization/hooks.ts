import { useContext } from 'react';

import { AuthorizationContext } from './AuthorizationContext';
import type { AuthorizationContextValue } from './AuthorizationContext';
import type { PermissionKey } from './types';

export function useAuthorization(): AuthorizationContextValue {
  const context = useContext(AuthorizationContext);
  if (!context) {
    throw new Error('useAuthorization must be used within an AuthorizationProvider');
  }
  return context;
}

export function useCan(permissionKey: PermissionKey): boolean {
  return useAuthorization().can(permissionKey);
}

export function useHasAnyPermission(permissionKeys: readonly PermissionKey[]): boolean {
  return useAuthorization().hasAny(permissionKeys);
}

export function useHasAllPermissions(permissionKeys: readonly PermissionKey[]): boolean {
  return useAuthorization().hasAll(permissionKeys);
}
