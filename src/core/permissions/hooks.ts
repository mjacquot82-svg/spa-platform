import { useCallback, useEffect, useState } from 'react';

import type { PermissionService } from './service';
import type {
  Permission,
  PermissionFilters,
  RolePermission,
} from './types';

export interface PermissionQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface PermissionMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function usePermissions(
  service: PermissionService,
  filters?: PermissionFilters,
): PermissionQueryState<Permission[]> {
  return usePermissionList(() => service.list(filters), [service, JSON.stringify(filters ?? {})]);
}

export function useRolePermissions(
  service: PermissionService,
  businessId: string,
  roleId: string,
): PermissionQueryState<Permission[]> {
  return usePermissionList(
    () => service.listForRole(businessId, roleId),
    [service, businessId, roleId],
  );
}

export function usePermission(
  service: PermissionService,
  id: string | null,
): PermissionQueryState<Permission | null> {
  const [data, setData] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<Error | null>(null);
  const refetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await service.getById(id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service, id]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useAssignPermissionToRole(
  service: PermissionService,
  businessId: string,
  roleId: string,
): PermissionMutationState<[string], RolePermission> {
  return usePermissionMutation((permissionId) =>
    service.assignToRole(businessId, roleId, permissionId),
  );
}

export function useRemovePermissionFromRole(
  service: PermissionService,
  businessId: string,
  roleId: string,
): PermissionMutationState<[string], void> {
  return usePermissionMutation((permissionId) =>
    service.removeFromRole(businessId, roleId, permissionId),
  );
}

function usePermissionList(
  load: () => Promise<Permission[]>,
  dependencies: readonly unknown[],
): PermissionQueryState<Permission[]> {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  // Public hooks provide the complete dependency list for their load closure.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

function usePermissionMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): PermissionMutationState<TArguments, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mutate = useCallback(async (...args: TArguments) => {
    setLoading(true);
    setError(null);
    try {
      return await operation(...args);
    } catch (cause) {
      const nextError = toError(cause);
      setError(nextError);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [operation]);
  const reset = useCallback(() => setError(null), []);
  return { mutate, loading, error, reset };
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error('An unknown permission error occurred.');
}
