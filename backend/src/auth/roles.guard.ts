import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { INTERNAL_ROLES_KEY } from './roles.decorator';
import { InternalModuleRole } from './internal-role.util';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<
      InternalModuleRole[] | undefined
    >(INTERNAL_ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.user?.role as InternalModuleRole | undefined;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'El usuario no tiene permisos para acceder a este recurso.',
      );
    }

    return true;
  }
}
