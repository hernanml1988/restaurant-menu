import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditLogService } from './audit_log.service';

@Controller('audit-log')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@InternalRoles('admin')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findRecent(@Query('limit') limit?: string) {
    return {
      message: 'Bitacora obtenida exitosamente',
      data: await this.auditLogService.findRecent(
        Math.min(Number(limit || 100), 300),
      ),
    };
  }
}
