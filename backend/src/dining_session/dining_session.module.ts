import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit_log/audit_log.module';
import { Order } from '../order/entities/order.entity';
import { Payment } from '../payment/entities/payment.entity';
import { ServiceRequest } from '../service_request/entities/service_request.entity';
import { TableModule } from '../table/table.module';
import { Table } from '../table/entities/table.entity';
import { DiningSessionController } from './dining_session.controller';
import { DiningSessionService } from './dining_session.service';
import { DiningSession } from './entities/dining_session.entity';

@Module({
  imports: [
    AuditLogModule,
    TypeOrmModule.forFeature([DiningSession, Table, Order, Payment, ServiceRequest]),
    TableModule,
  ],
  controllers: [DiningSessionController],
  providers: [DiningSessionService],
  exports: [DiningSessionService, TypeOrmModule],
})
export class DiningSessionModule {}
