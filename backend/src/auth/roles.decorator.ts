import { SetMetadata } from '@nestjs/common';
import { InternalModuleRole } from './internal-role.util';

export const INTERNAL_ROLES_KEY = 'internal_roles';
export const InternalRoles = (...roles: InternalModuleRole[]) =>
  SetMetadata(INTERNAL_ROLES_KEY, roles);
