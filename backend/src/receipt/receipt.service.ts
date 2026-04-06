import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit_log/audit_log.service';
import { DiningSessionService } from '../dining_session/dining_session.service';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Payment } from '../payment/entities/payment.entity';
import Utils from '../utils/errorUtils';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { Receipt, ReceiptTypeEnum } from './entities/receipt.entity';

@Injectable()
export class ReceiptService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly diningSessionService: DiningSessionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private formatMoney(value: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  private buildPrintableHtml(snapshot: Record<string, any>) {
    const rows = (snapshot.orders ?? [])
      .map(
        (order: any) =>
          `<tr><td>#${order.number}</td><td>${order.items
            .map((item: any) => `${item.quantity}x ${item.productName}`)
            .join(', ')}</td><td style="text-align:right">${this.formatMoney(
            order.total,
          )}</td></tr>`,
      )
      .join('');

    return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Comprobante ${snapshot.code}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
      h1, h2, p { margin: 0 0 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      td, th { padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
      .summary { margin-top: 16px; }
      .summary p { display:flex; justify-content:space-between; }
    </style>
  </head>
  <body>
    <h1>${snapshot.restaurant.name}</h1>
    <p>Mesa: ${snapshot.table.name}</p>
    <p>Sesion: ${snapshot.sessionToken}</p>
    <p>Comprobante: ${snapshot.code}</p>
    <p>Tipo: ${snapshot.type}</p>
    <table>
      <thead>
        <tr><th>Pedido</th><th>Detalle</th><th style="text-align:right">Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary">
      <p><span>Total cuenta</span><strong>${this.formatMoney(
        snapshot.totalAccount,
      )}</strong></p>
      <p><span>Pagado</span><strong>${this.formatMoney(
        snapshot.paidAmount,
      )}</strong></p>
      <p><span>Saldo</span><strong>${this.formatMoney(
        snapshot.balanceDue,
      )}</strong></p>
    </div>
  </body>
</html>`;
  }

  async create(createReceiptDto: CreateReceiptDto, actor: string) {
    try {
      const diningSession = await this.diningSessionRepository.findOne({
        where: {
          sessionToken: createReceiptDto.sessionToken,
          state: true,
        },
        relations: {
          restaurant: true,
          table: true,
        },
      });

      if (!diningSession) {
        throw new NotFoundException('Dining session not found');
      }

      const payment = createReceiptDto.paymentId
        ? await this.paymentRepository.findOne({
            where: { id: createReceiptDto.paymentId },
          })
        : null;

      if (createReceiptDto.paymentId && !payment) {
        throw new NotFoundException('Payment not found');
      }

      const account = await this.diningSessionService.getAccountSummaryByToken(
        createReceiptDto.sessionToken,
      );

      const code = `RCPT-${Date.now()}`;
      const snapshot = {
        code,
        type: createReceiptDto.type,
        restaurant: {
          name: diningSession.restaurant.name,
        },
        table: {
          name: diningSession.table.name,
        },
        sessionToken: diningSession.sessionToken,
        totalAccount: account.totalAccount,
        paidAmount: account.paidAmount,
        balanceDue: account.balanceDue,
        orders: account.orders,
        payment: payment
          ? {
              id: payment.id,
              amount: payment.amount,
              tipAmount: payment.tipAmount,
              method: payment.method,
            }
          : null,
      };

      const receipt = this.receiptRepository.create({
        code,
        type: createReceiptDto.type,
        totalAmount:
          createReceiptDto.type === ReceiptTypeEnum.PAYMENT && payment
            ? Number(payment.amount) + Number(payment.tipAmount ?? 0)
            : Number(account.totalAccount),
        snapshot,
        printableHtml: this.buildPrintableHtml(snapshot),
        issuedBy: actor,
        restaurant: diningSession.restaurant,
        table: diningSession.table,
        diningSession,
        payment,
      });

      const createdReceipt = await this.receiptRepository.save(receipt);

      await this.auditLogService.record({
        actor,
        action: 'receipt.issued',
        entityType: 'receipt',
        entityId: createdReceipt.id,
        metadata: {
          code: createdReceipt.code,
          type: createdReceipt.type,
          sessionToken: diningSession.sessionToken,
        },
      });

      return {
        message: 'Comprobante emitido exitosamente',
        data: createdReceipt,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const receipts = await this.receiptRepository.find({
        relations: {
          restaurant: true,
          table: true,
          diningSession: true,
          payment: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        message: 'Comprobantes obtenidos exitosamente',
        data: receipts,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
