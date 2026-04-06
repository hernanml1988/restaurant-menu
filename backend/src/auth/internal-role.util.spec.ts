import { mapRoleNameToInternalRole } from './internal-role.util';

describe('mapRoleNameToInternalRole', () => {
  it('maps admin-like role names to admin', () => {
    expect(mapRoleNameToInternalRole(['Super-Administrador'])).toBe('admin');
  });

  it('maps kitchen-like role names to kitchen', () => {
    expect(mapRoleNameToInternalRole(['Jefe de Cocina'])).toBe('kitchen');
  });

  it('returns null for unsupported role names', () => {
    expect(mapRoleNameToInternalRole(['Mesero'])).toBeNull();
  });
});
