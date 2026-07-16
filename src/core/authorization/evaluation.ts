import type { PermissionKey } from './types';

export function canPermission(
  permissionKeys: ReadonlySet<PermissionKey>,
  permissionKey: PermissionKey,
): boolean {
  const key = permissionKey.trim();
  return key.length > 0 && permissionKeys.has(key);
}

export function hasAnyPermission(
  permissionKeys: ReadonlySet<PermissionKey>,
  requestedKeys: readonly PermissionKey[],
): boolean {
  return requestedKeys.length > 0 && requestedKeys.some((key) => canPermission(permissionKeys, key));
}

export function hasAllPermissions(
  permissionKeys: ReadonlySet<PermissionKey>,
  requestedKeys: readonly PermissionKey[],
): boolean {
  return requestedKeys.length > 0 && requestedKeys.every((key) => canPermission(permissionKeys, key));
}
