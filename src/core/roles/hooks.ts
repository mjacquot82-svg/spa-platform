import { useCallback, useEffect, useState } from 'react';

import type { RoleService } from './service';
import type { CreateRoleInput, Role, RoleFilters, UpdateRoleInput } from './types';

export interface RoleQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface RoleMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useRoles(
  service: RoleService,
  businessId: string,
  filters?: RoleFilters,
): RoleQueryState<Role[]> {
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const filterKey = JSON.stringify(filters ?? {});
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await service.list(businessId, filters));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  // filterKey provides value-based dependencies for plain filter objects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, businessId, filterKey]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useRole(
  service: RoleService,
  businessId: string,
  id: string | null,
): RoleQueryState<Role | null> {
  const [data, setData] = useState<Role | null>(null);
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
      setData(await service.getById(businessId, id));
    } catch (cause) {
      setError(toError(cause));
    } finally {
      setLoading(false);
    }
  }, [service, businessId, id]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useCreateRole(
  service: RoleService,
  businessId: string,
): RoleMutationState<[CreateRoleInput], Role> {
  return useRoleMutation((input) => service.create(businessId, input));
}

export function useUpdateRole(
  service: RoleService,
  businessId: string,
): RoleMutationState<[string, UpdateRoleInput], Role> {
  return useRoleMutation((id, input) => service.update(businessId, id, input));
}

export function useDeleteRole(
  service: RoleService,
  businessId: string,
): RoleMutationState<[string], void> {
  return useRoleMutation((id) => service.delete(businessId, id));
}

function useRoleMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): RoleMutationState<TArguments, TResult> {
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
  return cause instanceof Error ? cause : new Error('An unknown role error occurred.');
}
