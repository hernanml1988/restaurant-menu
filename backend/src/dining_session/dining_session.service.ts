import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { Table, TableStatusEnum } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { CloseDiningSessionDto } from './dto/close-dining-session.dto';
import { StartDiningSessionDto } from './dto/start-dining-session.dto';
import { DiningSession } from './entities/dining_session.entity';

@Injectable()
export class DiningSessionService {
  constructor(
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  private buildSessionSummary(session: DiningSession) {
    const orders = session.orders ?? [];
    const totalAccount = orders.reduce(
      (accumulator, order) => accumulator + Number(order.total ?? 0),
      0,
    );

    return {
      ...session,
      totalAccount,
      orderCount: orders.length,
    };
  }

  async start(startDiningSessionDto: StartDiningSessionDto) {
    try {
      const table = await this.tableRepository.findOne({
        where: {
          qrCode: startDiningSessionDto.qrCode,
          state: true,
        },
        relations: {
          restaurant: true,
        },
      });

      if (!table) {
        throw new NotFoundException('Table not found');
      }

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
          },
        });

        if (!existingSession) {
          throw new NotFoundException('Dining session not found');
        }

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
        },
      });

      return {
        message: 'Sesion creada exitosamente',
        data: this.buildSessionSummary(createdSession),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findActiveByToken(sessionToken: string) {
    try {
      const session = await this.diningSessionRepository.findOne({
        where: {
          sessionToken,
          active: true,
          state: true,
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
        },
      });

      if (!session) {
        throw new NotFoundException('Dining session not found');
      }

      return {
        message: 'Sesion obtenida exitosamente',
        data: this.buildSessionSummary(session),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async close(
    sessionToken: string,
    closeDiningSessionDto?: CloseDiningSessionDto,
  ) {
    try {
      const session = await this.diningSessionRepository.findOne({
        where: {
          sessionToken,
          active: true,
          state: true,
        },
        relations: {
          table: true,
          restaurant: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Dining session not found');
      }

      const table = session.table;
      const orderCount = await this.orderRepository.count({
        where: {
          diningSession: { id: session.id },
        },
      });

      if (orderCount === 0) {
        throw new BadRequestException(
          'Dining session cannot be closed without orders',
        );
      }

      session.active = false;
      session.closedAt = new Date();
      session.modifiedBy =
        closeDiningSessionDto?.closedBy?.trim() || 'system01';
      await this.diningSessionRepository.save(session);

      const activeSessionsForTable = await this.diningSessionRepository.count({
        where: {
          table: { id: table.id },
          active: true,
          state: true,
        },
      });

      const activeOrdersForTable = await this.orderRepository.count({
        where: {
          table: { id: table.id },
          diningSession: {
            active: true,
          },
        },
      });

      table.activeOrders = activeOrdersForTable;
      table.serviceStatus =
        activeSessionsForTable > 0
          ? TableStatusEnum.WITH_ORDER
          : TableStatusEnum.FREE;
      await this.tableRepository.save(table);

      return {
        message: 'Sesion cerrada exitosamente',
        data: {
          sessionToken: session.sessionToken,
          closedAt: session.closedAt,
          active: session.active,
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
