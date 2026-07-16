import { createContext } from 'react';

import type { PermissionKey } from './types';

export interface AuthorizationContextValue {
  membershipId: string | null;
  permissionKeys: ReadonlySet<PermissionKey>;
  loading: boolean;
  error: Error | null;
  can: (permissionKey: PermissionKey) => boolean;
  hasAny: (permissionKeys: readonly PermissionKey[]) => boolean;
  hasAll: (permissionKeys: readonly PermissionKey[]) => boolean;
  refresh: () => Promise<void>;
}

export const AuthorizationContext = createContext<AuthorizationContextValue | undefined>(
  undefined,
);
