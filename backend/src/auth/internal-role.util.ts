export type InternalModuleRole = 'admin' | 'kitchen';

export function normalizeRoleName(roleName: string) {
  return roleName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function mapRoleNameToInternalRole(
  roleNames: string[],
): InternalModuleRole | null {
  const normalizedRoles = roleNames.map(normalizeRoleName);

  if (normalizedRoles.some((roleName) => roleName.includes('admin'))) {
    return 'admin';
  }

  if (
    normalizedRoles.some(
      (roleName) =>
        roleName.includes('cocina') ||
        roleName.includes('kitchen') ||
        roleName.includes('chef'),
    )
  ) {
    return 'kitchen';
  }

  return null;
}
