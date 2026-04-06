import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit_log/audit_log.module';
import { DiningSessionModule } from '../dining_session/dining_session.module';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Receipt } from '../receipt/entities/receipt.entity';
import { FiscalDocumentController } from './fiscal_document.controller';
import { FiscalDocumentService } from './fiscal_document.service';
import { FiscalDocument } from './entities/fiscal_document.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FiscalDocument, DiningSession, Payment, Receipt]),
    DiningSessionModule,
    AuditLogModule,
  ],
  controllers: [FiscalDocumentController],
  providers: [FiscalDocumentService],
  exports: [FiscalDocumentService, TypeOrmModule],
})
export class FiscalDocumentModule {}
