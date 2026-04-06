import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit_log/audit_log.module';
import { DiningSessionModule } from '../dining_session/dining_session.module';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Payment } from '../payment/entities/payment.entity';
import { ReceiptController } from './receipt.controller';
import { ReceiptService } from './receipt.service';
import { Receipt } from './entities/receipt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receipt, DiningSession, Payment]),
    DiningSessionModule,
    AuditLogModule,
  ],
  controllers: [ReceiptController],
  providers: [ReceiptService],
  exports: [ReceiptService, TypeOrmModule],
})
export class ReceiptModule {}
