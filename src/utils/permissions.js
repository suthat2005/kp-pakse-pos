// Shared permission helpers.
//
// The same sub-permission check was previously duplicated inside every
// feature component (hasPosPermission, hasInventoryPermission, ...). It
// resolves to true for owners, for users with the `admin` permission, and
// for users that explicitly hold the requested sub-permission.

export function hasPermission(user, subKey) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (user.permissions?.admin) return true;
  return !!user.permissions?.[subKey];
}

// Returns a checker bound to a given user, so call sites can keep using the
// familiar `hasXPermission(subKey)` signature.
export function createPermissionChecker(user) {
  return (subKey) => hasPermission(user, subKey);
}
