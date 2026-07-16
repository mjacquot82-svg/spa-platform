import {
  canPermission,
  hasAllPermissions,
  hasAnyPermission,
} from './evaluation';
import type { PermissionResolutionService } from './permission-resolution.service';
import type { PermissionKey } from './types';

export class AuthorizationService {
  constructor(private readonly resolution: PermissionResolutionService) {}

  async can(membershipId: string, permissionKey: PermissionKey): Promise<boolean> {
    const snapshot = await this.resolution.resolve(membershipId);
    return canPermission(snapshot.permissionKeys, permissionKey);
  }

  async hasAny(
    membershipId: string,
    permissionKeys: readonly PermissionKey[],
  ): Promise<boolean> {
    const snapshot = await this.resolution.resolve(membershipId);
    return hasAnyPermission(snapshot.permissionKeys, permissionKeys);
  }

  async hasAll(
    membershipId: string,
    permissionKeys: readonly PermissionKey[],
  ): Promise<boolean> {
    const snapshot = await this.resolution.resolve(membershipId);
    return hasAllPermissions(snapshot.permissionKeys, permissionKeys);
  }

  refresh(membershipId: string) {
    return this.resolution.resolve(membershipId, true);
  }

  invalidate(membershipId?: string): void {
    this.resolution.invalidate(membershipId);
  }
}
