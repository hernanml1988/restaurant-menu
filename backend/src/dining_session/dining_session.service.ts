import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit_log/audit_log.service';
import { Order } from '../order/entities/order.entity';
import { Payment, PaymentStatusEnum } from '../payment/entities/payment.entity';
import {
  ServiceRequest,
  ServiceRequestStatusEnum,
  ServiceRequestTypeEnum,
} from '../service_request/entities/service_request.entity';
import { TableService } from '../table/table.service';
import { Table, TableStatusEnum } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { CloseDiningSessionDto } from './dto/close-dining-session.dto';
import { ReopenDiningSessionDto } from './dto/reopen-dining-session.dto';
import { StartDiningSessionDto } from './dto/start-dining-session.dto';
import {
  DiningSession,
  DiningSessionAccountStatusEnum,
} from './entities/dining_session.entity';
import { extractTableQrToken } from '../table/table-qr.utils';

@Injectable()
export class DiningSessionService {
  private readonly logger = new Logger(DiningSessionService.name);

  constructor(
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    private readonly tableService: TableService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private roundCurrency(value: number) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  private buildSessionSummary(session: DiningSession) {
    const orders = session.orders ?? [];
    const payments = session.payments ?? [];
    const totalAccount = orders.reduce(
      (accumulator, order) => accumulator + Number(order.total ?? 0),
      0,
    );
    const paidAmount = payments
      .filter(
        (payment) =>
          payment.state && payment.paymentStatus === PaymentStatusEnum.PAID,
      )
      .reduce(
        (accumulator, payment) => accumulator + Number(payment.amount ?? 0),
        0,
      );
    const tipAmount = payments
      .filter(
        (payment) =>
          payment.state && payment.paymentStatus === PaymentStatusEnum.PAID,
      )
      .reduce(
        (accumulator, payment) => accumulator + Number(payment.tipAmount ?? 0),
        0,
      );
    const receivedAmount = payments
      .filter(
        (payment) =>
          payment.state && payment.paymentStatus === PaymentStatusEnum.PAID,
      )
      .reduce(
        (accumulator, payment) =>
          accumulator + Number(payment.receivedAmount ?? 0),
        0,
      );
    const changeAmount = payments
      .filter(
        (payment) =>
          payment.state && payment.paymentStatus === PaymentStatusEnum.PAID,
      )
      .reduce(
        (accumulator, payment) =>
          accumulator + Number(payment.changeAmount ?? 0),
        0,
      );
    const balanceDue = this.roundCurrency(totalAccount - paidAmount);

    return {
      ...session,
      totalAccount: this.roundCurrency(totalAccount),
      paidAmount: this.roundCurrency(paidAmount),
      tipAmount: this.roundCurrency(tipAmount),
      receivedAmount: this.roundCurrency(receivedAmount),
      changeAmount: this.roundCurrency(changeAmount),
      balanceDue,
      orderCount: orders.length,
      paymentCount: payments.filter((payment) => payment.state).length,
    };
  }

  private async loadSessionByToken(sessionToken: string, includeClosed = true) {
    const session = await this.diningSessionRepository.findOne({
      where: {
        sessionToken,
        state: true,
        ...(includeClosed ? {} : { active: true }),
      },
      relations: {
        restaurant: true,
        table: true,
        orders: {
          items: {
            selectedExtras: {
              productExtra: true,
            },
          },
        },
        payments: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Dining session not found');
    }

    return session;
  }

  public async getAccountSummaryByToken(sessionToken: string) {
    const session = await this.loadSessionByToken(sessionToken, true);
    return this.buildSessionSummary(session);
  }

  public async syncTableServiceState(tableId: string) {
    const table = await this.tableRepository.findOne({
      where: { id: tableId },
    });

    if (!table) {
      return;
    }

    table.activeOrders = await this.orderRepository.count({
      where: {
        table: { id: tableId },
        state: true,
        diningSession: {
          active: true,
          state: true,
        },
      },
    });

    const activeSessions = await this.diningSessionRepository.find({
      where: {
        table: { id: tableId },
        active: true,
        state: true,
      },
    });

    const hasPendingPaymentSession = activeSessions.some(
      (session) =>
        session.accountStatus ===
        DiningSessionAccountStatusEnum.PAYMENT_PENDING,
    );

    if (hasPendingPaymentSession) {
      table.serviceStatus = TableStatusEnum.PENDING_PAYMENT;
    } else if (table.activeOrders > 0) {
      table.serviceStatus = TableStatusEnum.WITH_ORDER;
    } else if (activeSessions.length > 0) {
      table.serviceStatus = TableStatusEnum.OCCUPIED;
    } else {
      table.serviceStatus = TableStatusEnum.FREE;
    }

    await this.tableRepository.save(table);
  }

  public async syncSessionFinancialState(sessionId: string, actor = 'system01') {
    const session = await this.diningSessionRepository.findOne({
      where: {
        id: sessionId,
        state: true,
      },
      relations: {
        table: true,
        orders: true,
        payments: true,
      },
    });

    if (!session) {
      return null;
    }

    const summary = this.buildSessionSummary(session);

    if (!session.active) {
      session.accountStatus = DiningSessionAccountStatusEnum.CLOSED;
    } else if (summary.balanceDue <= 0 && summary.totalAccount > 0) {
      session.accountStatus = DiningSessionAccountStatusEnum.PAID;
    } else if (
      session.accountStatus === DiningSessionAccountStatusEnum.PAYMENT_PENDING
    ) {
      session.accountStatus = DiningSessionAccountStatusEnum.PAYMENT_PENDING;
    } else {
      session.accountStatus = DiningSessionAccountStatusEnum.OPEN;
    }

    session.modifiedBy = actor;
    await this.diningSessionRepository.save(session);
    await this.syncTableServiceState(session.table.id);

    return session;
  }

  async start(startDiningSessionDto: StartDiningSessionDto) {
    try {
      this.logger.log(
        `[start] received qrCode="${startDiningSessionDto.qrCode}" qrToken="${extractTableQrToken(startDiningSessionDto.qrCode)}" existingSessionToken="${startDiningSessionDto.existingSessionToken ?? ''}"`,
      );

      const table = await this.tableService.findActiveTableByQrValue(
        startDiningSessionDto.qrCode,
      );

      if (!table) {
        throw new NotFoundException('Table not found');
      }

      this.logger.log(
        `[start] tableResolved id=${table.id} number=${table.number} name="${table.name}" serviceStatus=${table.serviceStatus}`,
      );

      if (startDiningSessionDto.existingSessionToken) {
        const existingSession = await this.diningSessionRepository.findOne({
          where: {
            sessionToken: startDiningSessionDto.existingSessionToken,
            active: true,
            state: true,
            table: { id: table.id },
          },
          relations: {
            restaurant: true,
            table: true,
            orders: {
              items: {
                selectedExtras: {
                  productExtra: true,
                },
              },
            },
            payments: true,
          },
        });

        if (!existingSession) {
          throw new NotFoundException('Dining session not found');
        }

        this.logger.log(
          `[start] reusedSession sessionToken="${existingSession.sessionToken}" tableId=${table.id}`,
        );

        return {
          message: 'Sesion reutilizada exitosamente',
          data: this.buildSessionSummary(existingSession),
        };
      }

      const diningSession = this.diningSessionRepository.create({
        sessionToken: randomUUID(),
        active: true,
        restaurant: table.restaurant,
        table,
        accountStatus: DiningSessionAccountStatusEnum.OPEN,
      });

      const savedSession =
        await this.diningSessionRepository.save(diningSession);

      if (table.serviceStatus === TableStatusEnum.FREE) {
        table.serviceStatus = TableStatusEnum.OCCUPIED;
        await this.tableRepository.save(table);
      }

      const createdSession = await this.diningSessionRepository.findOne({
        where: { id: savedSession.id },
        relations: {
          restaurant: true,
          table: true,
          orders: true,
          payments: true,
        },
      });

      this.logger.log(
        `[start] sessionCreated id=${createdSession.id} sessionToken="${createdSession.sessionToken}" tableId=${table.id}`,
      );
      await this.auditLogService.record({
        actor: 'client-session',
        action: 'dining-session.started',
        entityType: 'dining_session',
        entityId: createdSession.id,
        metadata: {
          sessionToken: createdSession.sessionToken,
          tableId: table.id,
        },
      });

      return {
        message: 'Sesion creada exitosamente',
        data: this.buildSessionSummary(createdSession),
      };
    } catch (error) {
      this.logger.error(
        `[start] failed qrCode="${startDiningSessionDto.qrCode}" qrToken="${extractTableQrToken(startDiningSessionDto.qrCode)}" existingSessionToken="${startDiningSessionDto.existingSessionToken ?? ''}" message="${error.message}"`,
        error.stack,
      );
      Utils.errorResponse(error);
    }
  }

  async findActiveByToken(sessionToken: string) {
    try {
      const session = await this.loadSessionByToken(sessionToken, false);

      return {
        message: 'Sesion obtenida exitosamente',
        data: this.buildSessionSummary(session),
      };
    } catch (error) {
      this.logger.error(
        `[findActiveByToken] failed sessionToken="${sessionToken}" message="${error.message}"`,
        error.stack,
      );
      Utils.errorResponse(error);
    }
  }

  async findAccountInternal(sessionToken: string) {
    try {
      return {
        message: 'Cuenta obtenida exitosamente',
        data: await this.getAccountSummaryByToken(sessionToken),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async markPaymentPending(sessionToken: string, actor = 'system01') {
    try {
      const session = await this.loadSessionByToken(sessionToken, true);

      if (!session.active) {
        throw new BadRequestException(
          'La sesion esta cerrada. Reabre la cuenta antes de marcarla por cobrar.',
        );
      }

      if (!(session.orders ?? []).length) {
        throw new BadRequestException(
          'La sesion no tiene pedidos para pasarla a cobro.',
        );
      }

      session.accountStatus = DiningSessionAccountStatusEnum.PAYMENT_PENDING;
      session.modifiedBy = actor;
      await this.diningSessionRepository.save(session);
      await this.syncTableServiceState(session.table.id);
      await this.auditLogService.record({
        actor,
        action: 'dining-session.payment-pending',
        entityType: 'dining_session',
        entityId: session.id,
        metadata: {
          sessionToken: session.sessionToken,
        },
      });

      return {
        message: 'Cuenta marcada por cobrar exitosamente',
        data: await this.getAccountSummaryByToken(sessionToken),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async close(
    sessionToken: string,
    closeDiningSessionDto?: CloseDiningSessionDto,
    actor = 'system01',
  ) {
    try {
      const session = await this.loadSessionByToken(sessionToken, true);

      if (!session.active || session.accountStatus === DiningSessionAccountStatusEnum.CLOSED) {
        throw new BadRequestException('La cuenta ya se encuentra cerrada.');
      }

      const orderCount = session.orders?.length ?? 0;

      if (orderCount === 0) {
        throw new BadRequestException(
          'Dining session cannot be closed without orders',
        );
      }

      const summary = this.buildSessionSummary(session);

      if (summary.balanceDue > 0.001) {
        throw new BadRequestException(
          'La cuenta no puede cerrarse mientras exista saldo pendiente.',
        );
      }

      session.active = false;
      session.closedAt = new Date();
      session.accountStatus = DiningSessionAccountStatusEnum.CLOSED;
      session.modifiedBy = actor || closeDiningSessionDto?.closedBy?.trim() || 'system01';
      await this.diningSessionRepository.save(session);

      await this.serviceRequestRepository.update(
        {
          diningSession: { id: session.id },
          type: ServiceRequestTypeEnum.BILL,
          requestStatus: ServiceRequestStatusEnum.PENDING,
        },
        {
          requestStatus: ServiceRequestStatusEnum.ATTENDED,
          attendedAt: new Date(),
          modifiedBy: actor,
        },
      );

      await this.syncTableServiceState(session.table.id);
      await this.auditLogService.record({
        actor,
        action: 'dining-session.closed',
        entityType: 'dining_session',
        entityId: session.id,
        metadata: {
          sessionToken: session.sessionToken,
          closedAt: session.closedAt?.toISOString() ?? null,
        },
      });

      return {
        message: 'Sesion cerrada exitosamente',
        data: {
          sessionToken: session.sessionToken,
          closedAt: session.closedAt,
          active: session.active,
          accountStatus: session.accountStatus,
        },
      };
    } catch (error) {
      this.logger.error(
        `[close] failed sessionToken="${sessionToken}" message="${error.message}"`,
        error.stack,
      );
      Utils.errorResponse(error);
    }
  }

  async reopen(
    sessionToken: string,
    reopenDiningSessionDto?: ReopenDiningSessionDto,
    actor = 'system01',
  ) {
    try {
      const session = await this.loadSessionByToken(sessionToken, true);

      if (session.active && session.accountStatus !== DiningSessionAccountStatusEnum.CLOSED) {
        throw new BadRequestException('La sesion ya se encuentra abierta.');
      }

      session.active = true;
      session.closedAt = null;
      session.modifiedBy =
        actor || reopenDiningSessionDto?.reopenedBy?.trim() || 'system01';
      await this.diningSessionRepository.save(session);
      await this.syncSessionFinancialState(session.id, session.modifiedBy);
      await this.auditLogService.record({
        actor,
        action: 'dining-session.reopened',
        entityType: 'dining_session',
        entityId: session.id,
        metadata: {
          sessionToken: session.sessionToken,
        },
      });

      return {
        message: 'Sesion reabierta exitosamente',
        data: await this.getAccountSummaryByToken(sessionToken),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
