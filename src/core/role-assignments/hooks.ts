import { useCallback, useEffect, useState } from 'react';

import type { RoleAssignmentService } from './service';
import type { CreateRoleAssignmentInput, RoleAssignment } from './types';

export interface RoleAssignmentQueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface RoleAssignmentMutationState<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useMembershipRoleAssignments(
  service: RoleAssignmentService,
  businessId: string,
  membershipId: string,
): RoleAssignmentQueryState<RoleAssignment[]> {
  return useRoleAssignmentList(
    () => service.listByMembership(businessId, membershipId),
    [service, businessId, membershipId],
  );
}

export function useRoleAssignments(
  service: RoleAssignmentService,
  businessId: string,
  roleId: string,
): RoleAssignmentQueryState<RoleAssignment[]> {
  return useRoleAssignmentList(
    () => service.listByRole(businessId, roleId),
    [service, businessId, roleId],
  );
}

export function useRoleAssignment(
  service: RoleAssignmentService,
  businessId: string,
  id: string | null,
): RoleAssignmentQueryState<RoleAssignment | null> {
  const [data, setData] = useState<RoleAssignment | null>(null);
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

export function useCreateRoleAssignment(
  service: RoleAssignmentService,
  businessId: string,
): RoleAssignmentMutationState<[CreateRoleAssignmentInput], RoleAssignment> {
  return useRoleAssignmentMutation((input) => service.create(businessId, input));
}

export function useDeleteRoleAssignment(
  service: RoleAssignmentService,
  businessId: string,
): RoleAssignmentMutationState<[string], void> {
  return useRoleAssignmentMutation((id) => service.delete(businessId, id));
}

function useRoleAssignmentList(
  load: () => Promise<RoleAssignment[]>,
  dependencies: readonly unknown[],
): RoleAssignmentQueryState<RoleAssignment[]> {
  const [data, setData] = useState<RoleAssignment[]>([]);
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

function useRoleAssignmentMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): RoleAssignmentMutationState<TArguments, TResult> {
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
  return cause instanceof Error ? cause : new Error('An unknown role assignment error occurred.');
}
