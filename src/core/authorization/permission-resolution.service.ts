import type { PermissionResolutionRepository } from './repository';
import type {
  AuthorizationSnapshot,
  PermissionKey,
  PermissionResolutionOptions,
} from './types';

const DEFAULT_CACHE_TTL_MS = 60_000;

export class PermissionResolutionService {
  private readonly cache = new Map<string, AuthorizationSnapshot>();
  private readonly pending = new Map<string, Promise<AuthorizationSnapshot>>();
  private readonly cacheTtlMs: number;

  constructor(
    private readonly repository: PermissionResolutionRepository,
    options: PermissionResolutionOptions = {},
  ) {
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    if (!Number.isFinite(this.cacheTtlMs) || this.cacheTtlMs < 0) {
      throw new TypeError('cacheTtlMs must be a non-negative finite number.');
    }
  }

  async resolve(membershipId: string, force = false): Promise<AuthorizationSnapshot> {
    const id = requireMembershipId(membershipId);
    const cached = this.cache.get(id);
    if (!force && cached && Date.now() - cached.resolvedAt < this.cacheTtlMs) {
      return cached;
    }

    const existing = this.pending.get(id);
    if (existing) return existing;

    const request = this.load(id).finally(() => this.pending.delete(id));
    this.pending.set(id, request);
    return request;
  }

  invalidate(membershipId?: string): void {
    if (membershipId === undefined) {
      this.cache.clear();
      return;
    }
    this.cache.delete(requireMembershipId(membershipId));
  }

  private async load(membershipId: string): Promise<AuthorizationSnapshot> {
    const keys = await this.repository.resolveForMembership(membershipId);
    const permissionKeys = new Set<PermissionKey>(
      keys.map((key) => key.trim()).filter((key) => key.length > 0),
    );
    const snapshot = { membershipId, permissionKeys, resolvedAt: Date.now() };
    this.cache.set(membershipId, snapshot);
    return snapshot;
  }
}

function requireMembershipId(value: string): string {
  if (!value.trim()) throw new TypeError('membershipId is required.');
  return value.trim();
}
