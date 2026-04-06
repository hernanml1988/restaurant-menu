import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit_log/audit_log.service';
import { Payment, PaymentStatusEnum } from '../payment/entities/payment.entity';
import { RestaurantService } from '../restaurant/restaurant.service';
import Utils from '../utils/errorUtils';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';
import {
  CashSession,
  CashSessionStatusEnum,
} from './entities/cash_session.entity';

@Injectable()
export class CashSessionService {
  constructor(
    @InjectRepository(CashSession)
    private readonly cashSessionRepository: Repository<CashSession>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly restaurantService: RestaurantService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private roundCurrency(value: number) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  private async resolveCurrentRestaurant() {
    return this.restaurantService.getCurrentRestaurantEntity();
  }

  private async resolveOpenSession() {
    const restaurant = await this.resolveCurrentRestaurant();

    return this.cashSessionRepository.findOne({
      where: {
        restaurant: { id: restaurant.id },
        state: true,
        sessionStatus: CashSessionStatusEnum.OPEN,
      },
      relations: {
        restaurant: true,
      },
      order: {
        openedAt: 'DESC',
      },
    });
  }

  private async calculateExpectedAmount(session: CashSession) {
    const totals = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount + payment.tipAmount), 0)', 'total')
      .where('payment.restaurantId = :restaurantId', {
        restaurantId: session.restaurant.id,
      })
      .andWhere('payment.state = true')
      .andWhere('payment.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatusEnum.PAID,
      })
      .andWhere('payment.createdAt >= :openedAt', { openedAt: session.openedAt })
      .andWhere(
        session.closedAt
          ? 'payment.createdAt <= :closedAt'
          : 'payment.createdAt >= :openedAt',
        session.closedAt
          ? { closedAt: session.closedAt }
          : { openedAt: session.openedAt },
      )
      .getRawOne<{ total: string }>();

    return this.roundCurrency(
      Number(session.openingAmount ?? 0) + Number(totals?.total ?? 0),
    );
  }

  async open(openCashSessionDto: OpenCashSessionDto, actor: string) {
    try {
      const existingOpenSession = await this.resolveOpenSession();

      if (existingOpenSession) {
        throw new BadRequestException(
          'Ya existe una caja abierta. Cierra la caja actual antes de abrir una nueva.',
        );
      }

      const restaurant = await this.resolveCurrentRestaurant();
      const cashSession = this.cashSessionRepository.create({
        openingAmount: openCashSessionDto.openingAmount,
        expectedAmount: openCashSessionDto.openingAmount,
        notes: openCashSessionDto.notes?.trim() || null,
        openedBy: actor,
        createdBy: actor,
        modifiedBy: actor,
        restaurant,
      });

      const created = await this.cashSessionRepository.save(cashSession);

      await this.auditLogService.record({
        actor,
        action: 'cash-session.opened',
        entityType: 'cash_session',
        entityId: created.id,
        metadata: {
          openingAmount: created.openingAmount,
        },
      });

      return {
        message: 'Caja abierta exitosamente',
        data: {
          ...created,
          expectedAmount: await this.calculateExpectedAmount(created),
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async close(closeCashSessionDto: CloseCashSessionDto, actor: string) {
    try {
      const cashSession = await this.resolveOpenSession();

      if (!cashSession) {
        throw new NotFoundException('No existe una caja abierta.');
      }

      cashSession.closedAt = new Date();
      cashSession.closedBy = actor;
      cashSession.sessionStatus = CashSessionStatusEnum.CLOSED;
      cashSession.closingAmount = this.roundCurrency(
        closeCashSessionDto.closingAmount,
      );
      cashSession.expectedAmount = await this.calculateExpectedAmount(cashSession);
      cashSession.differenceAmount = this.roundCurrency(
        Number(cashSession.closingAmount) - Number(cashSession.expectedAmount),
      );
      cashSession.notes = closeCashSessionDto.notes?.trim() || cashSession.notes;
      cashSession.modifiedBy = actor;

      const closedSession = await this.cashSessionRepository.save(cashSession);

      await this.auditLogService.record({
        actor,
        action: 'cash-session.closed',
        entityType: 'cash_session',
        entityId: closedSession.id,
        metadata: {
          expectedAmount: closedSession.expectedAmount,
          closingAmount: closedSession.closingAmount,
          differenceAmount: closedSession.differenceAmount,
        },
      });

      return {
        message: 'Caja cerrada exitosamente',
        data: closedSession,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findCurrent() {
    try {
      const session = await this.resolveOpenSession();

      if (!session) {
        return {
          message: 'No hay caja abierta',
          data: null,
        };
      }

      return {
        message: 'Caja actual obtenida exitosamente',
        data: {
          ...session,
          expectedAmount: await this.calculateExpectedAmount(session),
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findHistory() {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      const sessions = await this.cashSessionRepository.find({
        where: {
          restaurant: {
            id: restaurant.id,
          },
          state: true,
        },
        relations: {
          restaurant: true,
        },
        order: {
          openedAt: 'DESC',
        },
      });

      return {
        message: 'Historial de caja obtenido exitosamente',
        data: await Promise.all(
          sessions.map(async (session) => ({
            ...session,
            expectedAmount:
              session.sessionStatus === CashSessionStatusEnum.CLOSED
                ? session.expectedAmount
                : await this.calculateExpectedAmount(session),
          })),
        ),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
