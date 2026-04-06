import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThan, Repository } from 'typeorm';
import { CashSession, CashSessionStatusEnum } from '../cash_session/entities/cash_session.entity';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Order } from '../order/entities/order.entity';
import { OrderStatusEnum } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order_item.entity';
import { Product } from '../product/entities/product.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { Table } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { ReportRangeQueryDto } from './dto/report-range-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';

type ResolvedRange = {
  startDate: Date;
  endDate: Date;
};

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(CashSession)
    private readonly cashSessionRepository: Repository<CashSession>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  private async resolveCurrentRestaurant() {
    const restaurant = await this.restaurantRepository.findOne({
      where: { state: true },
      order: { createdAt: 'ASC' },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  private resolveRange(query: ReportRangeQueryDto): ResolvedRange {
    const now = new Date();

    if (query.startDate || query.endDate) {
      if (!query.startDate || !query.endDate) {
        throw new BadRequestException(
          'startDate and endDate must be provided together',
        );
      }

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        throw new BadRequestException('Invalid report date range');
      }

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (startDate > endDate) {
        throw new BadRequestException('startDate cannot be greater than endDate');
      }

      return { startDate, endDate };
    }

    const days = query.days ?? 7;
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));

    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  private getWeekdayLabel(date: Date) {
    return date.toLocaleDateString('es-CL', { weekday: 'short' });
  }

  private getHourLabel(hour: number) {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  private getDateLabel(date: Date) {
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  async getDashboardSummary(query: TopProductsQueryDto) {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      const range = this.resolveRange(query);
      const topLimit = query.limit ?? 5;

      const [totalTables, occupiedTables, activeOrders, salesSummary, prepRaw, topRows, stockAlerts, todayReservations, openCashSession, discountsRaw] =
        await Promise.all([
          this.tableRepository.count({
            where: {
              restaurant: { id: restaurant.id },
              state: true,
            },
          }),
          this.tableRepository.count({
            where: {
              restaurant: { id: restaurant.id },
              state: true,
              activeOrders: MoreThan(0),
            },
          }),
          this.orderRepository.count({
            where: {
              restaurant: { id: restaurant.id },
              state: true,
              orderStatus: In([
                OrderStatusEnum.RECEIVED,
                OrderStatusEnum.PREPARING,
                OrderStatusEnum.READY,
              ]),
              createdAt: Between(range.startDate, range.endDate),
            },
          }),
          this.orderRepository
            .createQueryBuilder('order')
            .select('COUNT(order.id)', 'totalOrders')
            .addSelect(
              `COUNT(CASE WHEN order.orderStatus = :deliveredStatus THEN 1 END)`,
              'completedOrders',
            )
            .addSelect('COALESCE(SUM(order.total), 0)', 'totalSalesToday')
            .where('order.restaurantId = :restaurantId', {
              restaurantId: restaurant.id,
            })
            .andWhere('order.state = true')
            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
            .setParameter('deliveredStatus', OrderStatusEnum.DELIVERED)
            .getRawOne<{
              totalOrders: string;
              completedOrders: string;
              totalSalesToday: string;
            }>(),
          this.orderRepository
            .createQueryBuilder('order')
            .select(
              `AVG(EXTRACT(EPOCH FROM (COALESCE(order.deliveredAt, order.estimatedReadyAt) - order.createdAt)) / 60.0)`,
              'avg',
            )
            .where('order.restaurantId = :restaurantId', {
              restaurantId: restaurant.id,
            })
            .andWhere('order.state = true')
            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
            .andWhere('COALESCE(order.deliveredAt, order.estimatedReadyAt) IS NOT NULL')
            .getRawOne<{ avg: string }>(),
          this.orderItemRepository
            .createQueryBuilder('orderItem')
            .innerJoin('orderItem.order', 'order')
            .innerJoin('orderItem.product', 'product')
            .select('product.id', 'productId')
            .addSelect('product.name', 'name')
            .addSelect('SUM(orderItem.quantity)', 'orders')
            .addSelect('SUM(orderItem.subtotal)', 'revenue')
            .where('order.restaurantId = :restaurantId', {
              restaurantId: restaurant.id,
            })
            .andWhere('order.state = true')
            .andWhere('orderItem.state = true')
            .andWhere('product.state = true')
            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
            .groupBy('product.id')
            .addGroupBy('product.name')
            .orderBy('orders', 'DESC')
            .addOrderBy('revenue', 'DESC')
            .limit(topLimit)
            .getRawMany<{
              productId: string;
              name: string;
              orders: string;
              revenue: string;
            }>(),
          this.productRepository.count({
            where: {
              restaurant: { id: restaurant.id },
              state: true,
              trackStock: true,
              stockQuantity: MoreThan(-1),
            },
          }).then(async () => {
            const products = await this.productRepository.find({
              where: {
                restaurant: { id: restaurant.id },
                state: true,
                trackStock: true,
              },
            });

            return products.filter(
              (product) =>
                Number(product.stockQuantity ?? 0) <=
                Number(product.stockAlertThreshold ?? 0),
            ).length;
          }),
          this.reservationRepository.count({
            where: {
              restaurant: { id: restaurant.id },
              state: true,
              reservationAt: Between(range.startDate, range.endDate),
            },
          }),
          this.cashSessionRepository.findOne({
            where: {
              restaurant: { id: restaurant.id },
              state: true,
              sessionStatus: CashSessionStatusEnum.OPEN,
            },
            order: {
              openedAt: 'DESC',
            },
          }),
          this.orderRepository
            .createQueryBuilder('order')
            .select('COALESCE(SUM(order.discountAmount), 0)', 'total')
            .where('order.restaurantId = :restaurantId', {
              restaurantId: restaurant.id,
            })
            .andWhere('order.state = true')
            .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
            .getRawOne<{ total: string }>(),
        ]);

      return {
        message: 'Resumen de dashboard obtenido exitosamente',
        data: {
          dateLabel: this.getDateLabel(range.endDate),
          occupiedTables,
          totalTables,
          activeOrders,
          completedOrders: Number(salesSummary?.completedOrders ?? 0),
          totalSalesToday: Number(salesSummary?.totalSalesToday ?? 0),
          avgPrepTime: Number(Number(prepRaw?.avg ?? 0).toFixed(2)),
          stockAlerts,
          todayReservations,
          hasOpenCashSession: !!openCashSession,
          discountsToday: Number(discountsRaw?.total ?? 0),
          topProducts: topRows.map((row, index) => ({
            rank: index + 1,
            productId: row.productId,
            name: row.name,
            orders: Number(row.orders ?? 0),
            revenue: Number(row.revenue ?? 0),
          })),
        },
        meta: {
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
          limit: topLimit,
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async getSalesByDay(query: ReportRangeQueryDto) {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      const range = this.resolveRange(query);

      const rows = await this.orderRepository
        .createQueryBuilder('order')
        .select(`DATE_TRUNC('day', order.createdAt)`, 'day')
        .addSelect('COALESCE(SUM(order.total), 0)', 'sales')
        .addSelect('COUNT(order.id)', 'orders')
        .where('order.restaurantId = :restaurantId', {
          restaurantId: restaurant.id,
        })
        .andWhere('order.state = true')
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
        .groupBy(`DATE_TRUNC('day', order.createdAt)`)
        .orderBy('day', 'ASC')
        .getRawMany<{ day: string; sales: string; orders: string }>();

      const salesByDayMap = new Map(
        rows.map((row) => [
          new Date(row.day).toISOString().slice(0, 10),
          {
            sales: Number(row.sales ?? 0),
            orders: Number(row.orders ?? 0),
          },
        ]),
      );

      const data = [];
      const cursor = new Date(range.startDate);

      while (cursor <= range.endDate) {
        const isoDate = cursor.toISOString().slice(0, 10);
        const values = salesByDayMap.get(isoDate);

        data.push({
          date: isoDate,
          day: this.getWeekdayLabel(cursor),
          sales: values?.sales ?? 0,
          orders: values?.orders ?? 0,
        });

        cursor.setDate(cursor.getDate() + 1);
      }

      return {
        message: 'Ventas por dia obtenidas exitosamente',
        data,
        meta: {
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async getPrepTimes(query: ReportRangeQueryDto) {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      const range = this.resolveRange(query);

      const rows = await this.orderRepository
        .createQueryBuilder('order')
        .select('EXTRACT(HOUR FROM order.createdAt)', 'hour')
        .addSelect(
          `AVG(EXTRACT(EPOCH FROM (COALESCE(order.deliveredAt, order.estimatedReadyAt) - order.createdAt)) / 60.0)`,
          'avg',
        )
        .addSelect('COUNT(order.id)', 'orders')
        .where('order.restaurantId = :restaurantId', {
          restaurantId: restaurant.id,
        })
        .andWhere('order.state = true')
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
        .andWhere('COALESCE(order.deliveredAt, order.estimatedReadyAt) IS NOT NULL')
        .groupBy('EXTRACT(HOUR FROM order.createdAt)')
        .orderBy('hour', 'ASC')
        .getRawMany<{ hour: string; avg: string; orders: string }>();

      return {
        message: 'Tiempos de preparacion obtenidos exitosamente',
        data: rows.map((row) => ({
          hour: this.getHourLabel(Number(row.hour)),
          avg: Number(Number(row.avg ?? 0).toFixed(2)),
          orders: Number(row.orders ?? 0),
        })),
        meta: {
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
          calculationSource: 'createdAt_to_deliveredAt_or_estimatedReadyAt',
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async getTopProducts(query: TopProductsQueryDto) {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      const range = this.resolveRange(query);
      const limit = query.limit ?? 5;

      const rows = await this.orderItemRepository
        .createQueryBuilder('orderItem')
        .innerJoin('orderItem.order', 'order')
        .innerJoin('orderItem.product', 'product')
        .select('product.id', 'productId')
        .addSelect('product.name', 'name')
        .addSelect('SUM(orderItem.quantity)', 'orders')
        .addSelect('SUM(orderItem.subtotal)', 'sales')
        .where('order.restaurantId = :restaurantId', {
          restaurantId: restaurant.id,
        })
        .andWhere('order.state = true')
        .andWhere('orderItem.state = true')
        .andWhere('product.state = true')
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
        .groupBy('product.id')
        .addGroupBy('product.name')
        .orderBy('orders', 'DESC')
        .addOrderBy('sales', 'DESC')
        .limit(limit)
        .getRawMany<{
          productId: string;
          name: string;
          orders: string;
          sales: string;
        }>();

      return {
        message: 'Productos mas pedidos obtenidos exitosamente',
        data: rows.map((row, index) => ({
          rank: index + 1,
          productId: row.productId,
          name: row.name,
          orders: Number(row.orders ?? 0),
          sales: Number(row.sales ?? 0),
        })),
        meta: {
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
          limit,
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async getWeeklySummary(query: ReportRangeQueryDto) {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      const range = this.resolveRange(query);

      const summary = await this.orderRepository
        .createQueryBuilder('order')
        .select('COUNT(order.id)', 'totalOrders')
        .addSelect('COALESCE(AVG(order.total), 0)', 'averageTicket')
        .addSelect('COALESCE(SUM(order.total), 0)', 'totalSales')
        .where('order.restaurantId = :restaurantId', {
          restaurantId: restaurant.id,
        })
        .andWhere('order.state = true')
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
        .getRawOne<{
          totalOrders: string;
          averageTicket: string;
          totalSales: string;
        }>();

      const sessionsRaw = await this.diningSessionRepository
        .createQueryBuilder('diningSession')
        .select('COUNT(diningSession.id)', 'total')
        .where('diningSession.restaurantId = :restaurantId', {
          restaurantId: restaurant.id,
        })
        .andWhere('diningSession.state = true')
        .andWhere('diningSession.createdAt BETWEEN :startDate AND :endDate', range)
        .getRawOne<{ total: string }>();

      const topProduct = await this.orderItemRepository
        .createQueryBuilder('orderItem')
        .innerJoin('orderItem.order', 'order')
        .innerJoin('orderItem.product', 'product')
        .select('product.name', 'name')
        .addSelect('SUM(orderItem.quantity)', 'orders')
        .where('order.restaurantId = :restaurantId', {
          restaurantId: restaurant.id,
        })
        .andWhere('order.state = true')
        .andWhere('orderItem.state = true')
        .andWhere('product.state = true')
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
        .groupBy('product.name')
        .orderBy('orders', 'DESC')
        .addOrderBy('name', 'ASC')
        .getRawOne<{ name: string; orders: string }>();

      const peakHour = await this.orderRepository
        .createQueryBuilder('order')
        .select('EXTRACT(HOUR FROM order.createdAt)', 'hour')
        .addSelect('COUNT(order.id)', 'orders')
        .where('order.restaurantId = :restaurantId', {
          restaurantId: restaurant.id,
        })
        .andWhere('order.state = true')
        .andWhere('order.createdAt BETWEEN :startDate AND :endDate', range)
        .groupBy('EXTRACT(HOUR FROM order.createdAt)')
        .orderBy('orders', 'DESC')
        .addOrderBy('hour', 'ASC')
        .getRawOne<{ hour: string; orders: string }>();

      const totalOrders = Number(summary?.totalOrders ?? 0);
      const peakHourOrders = Number(peakHour?.orders ?? 0);
      const peakHourShare = totalOrders
        ? Number(((peakHourOrders / totalOrders) * 100).toFixed(2))
        : 0;

      return {
        message: 'Resumen semanal obtenido exitosamente',
        data: {
          totalOrders,
          averageTicket: Number(Number(summary?.averageTicket ?? 0).toFixed(2)),
          totalSales: Number(summary?.totalSales ?? 0),
          customersServed: Number(sessionsRaw?.total ?? 0),
          starProduct: topProduct
            ? {
                name: topProduct.name,
                orders: Number(topProduct.orders ?? 0),
              }
            : null,
          peakHour: peakHour
            ? {
                label: `${this.getHourLabel(Number(peakHour.hour))} - ${this.getHourLabel(
                  (Number(peakHour.hour) + 1) % 24,
                )}`,
                orders: peakHourOrders,
                share: peakHourShare,
              }
            : null,
        },
        meta: {
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
          customersServedSource: 'dining_sessions_created',
        },
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
