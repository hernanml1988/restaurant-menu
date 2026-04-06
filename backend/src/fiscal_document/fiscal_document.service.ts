import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit_log/audit_log.service';
import { DiningSessionService } from '../dining_session/dining_session.service';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Receipt } from '../receipt/entities/receipt.entity';
import Utils from '../utils/errorUtils';
import { CreateFiscalDocumentDto } from './dto/create-fiscal-document.dto';
import { FiscalDocument } from './entities/fiscal_document.entity';

@Injectable()
export class FiscalDocumentService {
  constructor(
    @InjectRepository(FiscalDocument)
    private readonly fiscalDocumentRepository: Repository<FiscalDocument>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    private readonly diningSessionService: DiningSessionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createFiscalDocumentDto: CreateFiscalDocumentDto, actor: string) {
    try {
      const diningSession = await this.diningSessionRepository.findOne({
        where: {
          sessionToken: createFiscalDocumentDto.sessionToken,
          state: true,
        },
        relations: {
          restaurant: true,
        },
      });

      if (!diningSession) {
        throw new NotFoundException('Dining session not found');
      }

      const payment = createFiscalDocumentDto.paymentId
        ? await this.paymentRepository.findOne({
            where: { id: createFiscalDocumentDto.paymentId },
          })
        : null;
      const receipt = createFiscalDocumentDto.receiptId
        ? await this.receiptRepository.findOne({
            where: { id: createFiscalDocumentDto.receiptId },
          })
        : null;

      const account = await this.diningSessionService.getAccountSummaryByToken(
        createFiscalDocumentDto.sessionToken,
      );

      const fiscalDocument = this.fiscalDocumentRepository.create({
        folio: `FISC-${Date.now()}`,
        documentType: createFiscalDocumentDto.documentType,
        totalAmount: payment
          ? Number(payment.amount) + Number(payment.tipAmount ?? 0)
          : Number(account.totalAccount),
        payloadSnapshot: {
          sessionToken: diningSession.sessionToken,
          account,
          paymentId: payment?.id ?? null,
          receiptId: receipt?.id ?? null,
        },
        issuedBy: actor,
        restaurant: diningSession.restaurant,
        diningSession,
        payment,
        receipt,
      });

      const createdDocument = await this.fiscalDocumentRepository.save(
        fiscalDocument,
      );

      await this.auditLogService.record({
        actor,
        action: 'fiscal-document.issued',
        entityType: 'fiscal_document',
        entityId: createdDocument.id,
        metadata: {
          folio: createdDocument.folio,
          documentType: createdDocument.documentType,
        },
      });

      return {
        message: 'Documento fiscal registrado exitosamente',
        data: createdDocument,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      return {
        message: 'Documentos fiscales obtenidos exitosamente',
        data: await this.fiscalDocumentRepository.find({
          relations: {
            restaurant: true,
            diningSession: true,
            payment: true,
            receipt: true,
          },
          order: {
            createdAt: 'DESC',
          },
        }),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
