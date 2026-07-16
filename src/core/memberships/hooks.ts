import { useCallback, useEffect, useState } from 'react';

import type { MembershipService } from './service';
import type { CreateMembershipInput, Membership, UpdateMembershipInput } from './types';

export interface MembershipQuery<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface MembershipMutation<TArguments extends unknown[], TResult> {
  mutate: (...args: TArguments) => Promise<TResult>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useUserMemberships(
  service: MembershipService,
  userId: string,
): MembershipQuery<Membership[]> {
  return useMembershipList(() => service.listByUser(userId), [service, userId]);
}

export function useBusinessMemberships(
  service: MembershipService,
  businessId: string,
): MembershipQuery<Membership[]> {
  return useMembershipList(() => service.listByBusiness(businessId), [service, businessId]);
}

export function useMembership(
  service: MembershipService,
  id: string | null,
): MembershipQuery<Membership | null> {
  const [data, setData] = useState<Membership | null>(null);
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
  }, [id, service]);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

export function useMembershipMutations(service: MembershipService) {
  const create = useMembershipMutation((input: CreateMembershipInput) => service.create(input));
  const update = useMembershipMutation((id: string, input: UpdateMembershipInput) =>
    service.update(id, input),
  );
  const remove = useMembershipMutation((id: string) => service.delete(id));
  return { create, update, remove };
}

function useMembershipList(
  load: () => Promise<Membership[]>,
  dependencies: readonly unknown[],
): MembershipQuery<Membership[]> {
  const [data, setData] = useState<Membership[]>([]);
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
  // The public hooks provide the complete dependency list for their load closure.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => void refetch(), [refetch]);
  return { data, loading, error, refetch };
}

function useMembershipMutation<TArguments extends unknown[], TResult>(
  operation: (...args: TArguments) => Promise<TResult>,
): MembershipMutation<TArguments, TResult> {
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
  return cause instanceof Error ? cause : new Error('An unknown membership error occurred.');
}
