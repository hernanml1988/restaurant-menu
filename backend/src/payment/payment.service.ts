import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit_log/audit_log.service';
import {
  DiningSession,
  DiningSessionAccountStatusEnum,
} from '../dining_session/entities/dining_session.entity';
import { DiningSessionService } from '../dining_session/dining_session.service';
import Utils from '../utils/errorUtils';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  Payment,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    private readonly diningSessionService: DiningSessionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private roundCurrency(value: number) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  private normalizeNullableString(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private calculateSessionDue(session: DiningSession) {
    const orderTotal = (session.orders ?? []).reduce(
      (accumulator, order) => accumulator + Number(order.total ?? 0),
      0,
    );
    const paidAmount = (session.payments ?? [])
      .filter(
        (payment) =>
          payment.state && payment.paymentStatus === PaymentStatusEnum.PAID,
      )
      .reduce(
        (accumulator, payment) => accumulator + Number(payment.amount ?? 0),
        0,
      );

    return {
      orderTotal: this.roundCurrency(orderTotal),
      paidAmount: this.roundCurrency(paidAmount),
      balanceDue: this.roundCurrency(orderTotal - paidAmount),
    };
  }

  private async attachRelations(paymentId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: {
        restaurant: true,
        table: true,
        diningSession: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async create(createPaymentDto: CreatePaymentDto, actor: string) {
    try {
      const session = await this.diningSessionRepository.findOne({
        where: {
          sessionToken: createPaymentDto.sessionToken,
          state: true,
        },
        relations: {
          restaurant: true,
          table: true,
          orders: true,
          payments: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Dining session not found');
      }

      if (session.accountStatus === DiningSessionAccountStatusEnum.CLOSED) {
        throw new BadRequestException(
          'La cuenta esta cerrada. Reabre la sesion antes de registrar un pago.',
        );
      }

      if (!(session.orders ?? []).length) {
        throw new BadRequestException(
          'La sesion no tiene pedidos para registrar cobro.',
        );
      }

      const amount = this.roundCurrency(createPaymentDto.amount);
      const tipAmount = this.roundCurrency(createPaymentDto.tipAmount ?? 0);
      const { balanceDue } = this.calculateSessionDue(session);

      if (amount > balanceDue + 0.001) {
        throw new BadRequestException(
          'El monto del pago no puede exceder el saldo pendiente de la cuenta.',
        );
      }

      const minimumReceived = this.roundCurrency(amount + tipAmount);
      const receivedAmount = this.roundCurrency(
        createPaymentDto.receivedAmount ?? minimumReceived,
      );

      if (receivedAmount + 0.001 < minimumReceived) {
        throw new BadRequestException(
          'El monto recibido debe cubrir el pago aplicado y la propina.',
        );
      }

      if (
        createPaymentDto.method !== PaymentMethodEnum.CASH &&
        receivedAmount - minimumReceived > 0.001
      ) {
        throw new BadRequestException(
          'Solo los pagos en efectivo pueden registrar vuelto.',
        );
      }

      const payment = this.paymentRepository.create({
        method: createPaymentDto.method,
        paymentStatus: PaymentStatusEnum.PAID,
        amount,
        tipAmount,
        receivedAmount,
        changeAmount: this.roundCurrency(receivedAmount - minimumReceived),
        payerName: this.normalizeNullableString(createPaymentDto.payerName),
        reference: this.normalizeNullableString(createPaymentDto.reference),
        notes: this.normalizeNullableString(createPaymentDto.notes),
        restaurant: session.restaurant,
        table: session.table,
        diningSession: session,
        createdBy: actor,
        modifiedBy: actor,
      });

      const createdPayment = await this.paymentRepository.save(payment);
      await this.diningSessionService.syncSessionFinancialState(session.id, actor);
      await this.auditLogService.record({
        actor,
        action: 'payment.created',
        entityType: 'payment',
        entityId: createdPayment.id,
        metadata: {
          amount,
          tipAmount,
          method: createdPayment.method,
          sessionToken: createPaymentDto.sessionToken,
        },
      });

      return {
        message: 'Pago registrado exitosamente',
        data: {
          payment: await this.attachRelations(createdPayment.id),
          account: await this.diningSessionService.getAccountSummaryByToken(
            createPaymentDto.sessionToken,
          ),
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findBySessionToken(sessionToken: string) {
    try {
      const session = await this.diningSessionRepository.findOne({
        where: {
          sessionToken,
          state: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Dining session not found');
      }

      const payments = await this.paymentRepository.find({
        where: {
          diningSession: { id: session.id },
        },
        relations: {
          restaurant: true,
          table: true,
          diningSession: true,
        },
        order: {
          paidAt: 'DESC',
          createdAt: 'DESC',
        },
      });

      return {
        message: 'Pagos obtenidos exitosamente',
        data: payments,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async cancel(id: string, cancelPaymentDto: CancelPaymentDto, actor: string) {
    try {
      const payment = await this.attachRelations(id);

      if (payment.paymentStatus === PaymentStatusEnum.CANCELLED || !payment.state) {
        throw new BadRequestException('El pago ya se encuentra cancelado.');
      }

      if (payment.diningSession.accountStatus === DiningSessionAccountStatusEnum.CLOSED) {
        throw new BadRequestException(
          'No se puede cancelar un pago sobre una cuenta cerrada. Reabre la sesion primero.',
        );
      }

      payment.paymentStatus = PaymentStatusEnum.CANCELLED;
      payment.state = false;
      payment.deletedAt = new Date();
      payment.notes = this.normalizeNullableString(cancelPaymentDto.notes) || payment.notes;
      payment.modifiedBy = actor;

      await this.paymentRepository.save(payment);
      await this.diningSessionService.syncSessionFinancialState(
        payment.diningSession.id,
        actor,
      );
      await this.auditLogService.record({
        actor,
        action: 'payment.cancelled',
        entityType: 'payment',
        entityId: payment.id,
        metadata: {
          notes: payment.notes,
          sessionToken: payment.diningSession.sessionToken,
        },
      });

      return {
        message: 'Pago cancelado exitosamente',
        data: {
          payment: await this.attachRelations(id),
          account: await this.diningSessionService.getAccountSummaryByToken(
            payment.diningSession.sessionToken,
          ),
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
