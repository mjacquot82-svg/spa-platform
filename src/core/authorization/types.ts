export type PermissionKey = string;

export interface AuthorizationSnapshot {
  membershipId: string;
  permissionKeys: ReadonlySet<PermissionKey>;
  resolvedAt: number;
}

export interface PermissionResolutionOptions {
  cacheTtlMs?: number;
}
