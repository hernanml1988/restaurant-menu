import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogController } from './audit_log.controller';
import { AuditLogService } from './audit_log.service';
import { AuditLog } from './entities/audit_log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService, TypeOrmModule],
})
export class AuditLogModule {}
