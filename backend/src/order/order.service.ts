import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { AuditLogService } from '../audit_log/audit_log.service';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Payment, PaymentStatusEnum } from '../payment/entities/payment.entity';
import { Product } from '../product/entities/product.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { RealtimeService } from '../realtime/realtime.service';
import { Table, TableStatusEnum } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderSequence } from './entities/order_sequence.entity';
import {
  Order,
  OrderPriorityEnum,
  OrderStationEnum,
  OrderStatusEnum,
} from './entities/order.entity';
import { OrderItem } from './entities/order_item.entity';
import { OrderItemExtraSelection } from './entities/order_item_extra_selection.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderSequence)
    private readonly orderSequenceRepository: Repository<OrderSequence>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly realtimeService: RealtimeService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private roundCurrency(value: number) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  private async getNextOrderNumber(manager: EntityManager) {
    const sequenceRepository = manager.getRepository(OrderSequence);
    const orderRepository = manager.getRepository(Order);
    const scope = 'global';

    let sequence = await sequenceRepository.findOne({
      where: { scope },
      lock: { mode: 'pessimistic_write' },
    });

    if (!sequence) {
      sequence = sequenceRepository.create({
        scope,
        lastNumber: 0,
      });
    }

    const currentMaxOrder = await orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(MAX(order.number), 0)', 'max')
      .getRawOne<{ max: string }>();

    const persistedMax = Number(currentMaxOrder?.max ?? 0);
    sequence.lastNumber = Math.max(Number(sequence.lastNumber ?? 0), persistedMax);
    sequence.lastNumber += 1;
    await sequenceRepository.save(sequence);
    return sequence.lastNumber;
  }

  private async attachRelations(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        restaurant: true,
        table: true,
        diningSession: true,
        items: {
          product: true,
          selectedExtras: {
            productExtra: true,
          },
        },
      },
      order: {
        items: {
          createdAt: 'ASC',
          selectedExtras: {
            createdAt: 'ASC',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async findOrdersByFilters(filters?: {
    station?: Order['station'];
    orderStatuses?: OrderStatusEnum[];
    state?: boolean;
  }) {
    return this.orderRepository.find({
      where: {
        ...(filters?.station ? { station: filters.station } : {}),
        ...(filters?.orderStatuses?.length
          ? { orderStatus: In(filters.orderStatuses) }
          : {}),
        ...(filters?.state !== undefined ? { state: filters.state } : {}),
      },
      relations: {
        restaurant: true,
        table: true,
        diningSession: true,
        items: {
          product: true,
          selectedExtras: {
            productExtra: true,
          },
        },
      },
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
        items: {
          createdAt: 'ASC',
          selectedExtras: {
            createdAt: 'ASC',
          },
        },
      },
    });
  }

  private async syncDiningSessionAccountState(sessionId?: string | null) {
    if (!sessionId) {
      return;
    }

    const session = await this.diningSessionRepository.findOne({
      where: {
        id: sessionId,
        state: true,
      },
      relations: {
        orders: true,
      },
    });

    if (!session || !session.active) {
      return;
    }

    const paidAmountRaw = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.diningSessionId = :sessionId', { sessionId })
      .andWhere('payment.state = :state', { state: true })
      .andWhere('payment.paymentStatus = :paymentStatus', {
        paymentStatus: PaymentStatusEnum.PAID,
      })
      .getRawOne<{ total: string }>();

    const orderTotal = (session.orders ?? []).reduce(
      (accumulator, order) => accumulator + Number(order.total ?? 0),
      0,
    );
    const paidAmount = Number(paidAmountRaw?.total ?? 0);
    const balanceDue = this.roundCurrency(orderTotal - paidAmount);

    if (balanceDue <= 0 && orderTotal > 0) {
      session.accountStatus = 'paid' as any;
    } else if (session.accountStatus !== 'payment-pending') {
      session.accountStatus = 'open' as any;
    }

    await this.diningSessionRepository.save(session);
  }

  private async syncTableOrderState(tableId: string) {
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
      (session) => session.accountStatus === 'payment-pending',
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

  private applyDiscount(order: Order, updateOrderDto: UpdateOrderDto) {
    if (
      updateOrderDto.discountType === undefined &&
      updateOrderDto.discountValue === undefined &&
      updateOrderDto.discountReason === undefined
    ) {
      return;
    }

    const baseSubtotal = Number(
      order.subtotalBeforeDiscount || order.total || 0,
    );
    const discountType = updateOrderDto.discountType ?? null;
    const discountValue = Number(updateOrderDto.discountValue ?? 0);

    let discountAmount = 0;

    if (discountType === 'percentage') {
      discountAmount = (baseSubtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      discountAmount = discountValue;
    }

    discountAmount = this.roundCurrency(
      Math.max(0, Math.min(discountAmount, baseSubtotal)),
    );

    order.subtotalBeforeDiscount = this.roundCurrency(baseSubtotal);
    order.discountType = discountType;
    order.discountValue = discountValue;
    order.discountAmount = discountAmount;
    order.discountReason =
      updateOrderDto.discountReason !== undefined
        ? updateOrderDto.discountReason?.trim() || null
        : order.discountReason;
    order.total = this.roundCurrency(baseSubtotal - discountAmount);
  }

  private async adjustStockForItem(
    manager: EntityManager,
    product: Product,
    quantityDelta: number,
  ) {
    if (!product.trackStock) {
      return;
    }

    product.stockQuantity = Number(product.stockQuantity ?? 0) + quantityDelta;
    if (product.stockQuantity < 0) {
      throw new BadRequestException(
        `Stock insuficiente para el producto ${product.name}.`,
      );
    }

    if (product.stockQuantity <= 0) {
      product.available = false;
    } else if (product.available === false) {
      product.available = true;
    }

    await manager.getRepository(Product).save(product);
  }

  private async restoreStockForOrder(order: Order) {
    for (const item of order.items ?? []) {
      if (!item.product) {
        continue;
      }

      item.product.stockQuantity =
        Number(item.product.stockQuantity ?? 0) + Number(item.quantity ?? 0);
      if (item.product.trackStock && item.product.stockQuantity > 0) {
        item.product.available = true;
      }

      await this.orderRepository.manager.getRepository(Product).save(item.product);
    }
  }

  private async createOrderItems(
    manager: EntityManager,
    order: Order,
    createPublicOrderDto: CreatePublicOrderDto,
    diningSession: DiningSession,
  ) {
    let orderTotal = 0;

    for (const itemDto of createPublicOrderDto.items) {
      const product = await manager.getRepository(Product).findOne({
        where: {
          id: itemDto.productId,
          state: true,
          available: true,
          restaurant: { id: diningSession.restaurant.id },
        },
      });

      if (!product) {
        throw new NotFoundException(`Product not found: ${itemDto.productId}`);
      }

      if (
        product.trackStock &&
        Number(product.stockQuantity ?? 0) < Number(itemDto.quantity ?? 0)
      ) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.name}. Disponible: ${product.stockQuantity}.`,
        );
      }

      let extrasSubtotal = 0;
      const orderItemRepository = manager.getRepository(OrderItem);
      const orderItem = orderItemRepository.create({
        productName: product.name,
        quantity: itemDto.quantity,
        unitPrice: product.price,
        subtotal: 0,
        notes: itemDto.notes,
        order,
        product,
      });

      const savedOrderItem = await orderItemRepository.save(orderItem);

      for (const extraDto of itemDto.extras ?? []) {
        const productExtra = await manager.getRepository(ProductExtra).findOne({
          where: {
            id: extraDto.productExtraId,
            state: true,
            product: { id: product.id },
          },
        });

        if (!productExtra) {
          throw new NotFoundException(
            `Product extra not found: ${extraDto.productExtraId}`,
          );
        }

        extrasSubtotal += Number(productExtra.price ?? 0);

        const selection = manager
          .getRepository(OrderItemExtraSelection)
          .create({
            value: extraDto.value,
            priceImpact: productExtra.price,
            orderItem: savedOrderItem,
            productExtra,
          });

        await manager.getRepository(OrderItemExtraSelection).save(selection);
      }

      const itemSubtotal =
        (Number(product.price) + extrasSubtotal) * itemDto.quantity;
      savedOrderItem.subtotal = itemSubtotal;
      await orderItemRepository.save(savedOrderItem);
      orderTotal += itemSubtotal;

      await this.adjustStockForItem(manager, product, -Number(itemDto.quantity));
    }

    return orderTotal;
  }

  async createPublicOrder(createPublicOrderDto: CreatePublicOrderDto) {
    try {
      if (!createPublicOrderDto.items.length) {
        throw new BadRequestException('Order must include at least one item');
      }

      const diningSession = await this.diningSessionRepository.findOne({
        where: {
          sessionToken: createPublicOrderDto.sessionToken,
          active: true,
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

      const now = new Date();
      const orderedAtLabel = now.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const savedOrder = await this.orderRepository.manager.transaction(
        async (manager) => {
          const orderRepository = manager.getRepository(Order);
          const order = orderRepository.create({
            number: await this.getNextOrderNumber(manager),
            orderStatus: OrderStatusEnum.RECEIVED,
            priority:
              createPublicOrderDto.priority ?? OrderPriorityEnum.NORMAL,
            station: createPublicOrderDto.station,
            observations: createPublicOrderDto.observations,
            orderedAtLabel,
            restaurant: diningSession.restaurant,
            table: diningSession.table,
            diningSession,
          });

          const createdOrder = await orderRepository.save(order);
          createdOrder.subtotalBeforeDiscount = await this.createOrderItems(
            manager,
            createdOrder,
            createPublicOrderDto,
            diningSession,
          );
          createdOrder.total = createdOrder.subtotalBeforeDiscount;
          createdOrder.discountAmount = 0;

          return orderRepository.save(createdOrder);
        },
      );

      await this.syncDiningSessionAccountState(diningSession.id);
      await this.syncTableOrderState(diningSession.table.id);
      const orderWithRelations = await this.attachRelations(savedOrder.id);

      await this.auditLogService.record({
        actor: 'client-session',
        action: 'order.created',
        entityType: 'order',
        entityId: orderWithRelations.id,
        metadata: {
          sessionToken: orderWithRelations.diningSession?.sessionToken ?? null,
          number: orderWithRelations.number,
          total: orderWithRelations.total,
        },
      });

      await this.realtimeService.publishInternal('order.created', {
        orderId: orderWithRelations.id,
        number: orderWithRelations.number,
        orderStatus: orderWithRelations.orderStatus,
        tableName: orderWithRelations.table?.name ?? null,
        sessionToken: orderWithRelations.diningSession?.sessionToken ?? null,
      });
      if (orderWithRelations.diningSession?.sessionToken) {
        await this.realtimeService.publishSession(
          orderWithRelations.diningSession.sessionToken,
          'order.created',
          {
            orderId: orderWithRelations.id,
            number: orderWithRelations.number,
            orderStatus: orderWithRelations.orderStatus,
          },
        );
      }

      return {
        message: 'Pedido creado exitosamente',
        data: orderWithRelations,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const orders = await this.findOrdersByFilters();

      return {
        message: 'Pedidos obtenidos exitosamente',
        data: orders,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findKitchenBoard() {
    try {
      const orders = await this.findOrdersByFilters({
        station: OrderStationEnum.COCINA,
        orderStatuses: [
          OrderStatusEnum.RECEIVED,
          OrderStatusEnum.PREPARING,
          OrderStatusEnum.READY,
        ],
        state: true,
      });

      return {
        message: 'Pedidos de cocina obtenidos exitosamente',
        data: orders,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findOne(id: string) {
    try {
      return {
        message: 'Pedido obtenido exitosamente',
        data: await this.attachRelations(id),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, actor = 'system01') {
    try {
      const order = await this.attachRelations(id);

      Object.assign(order, {
        orderStatus: updateOrderDto.orderStatus ?? order.orderStatus,
        priority: updateOrderDto.priority ?? order.priority,
        station: updateOrderDto.station ?? order.station,
        state: updateOrderDto.state ?? order.state,
      });

      if (updateOrderDto.observations !== undefined) {
        const observations = updateOrderDto.observations.trim();
        order.observations = observations ? observations : null;
      }

      if (updateOrderDto.estimatedReadyAt !== undefined) {
        order.estimatedReadyAt = updateOrderDto.estimatedReadyAt
          ? new Date(updateOrderDto.estimatedReadyAt)
          : null;
      }

      if (updateOrderDto.deliveredAt !== undefined) {
        order.deliveredAt = updateOrderDto.deliveredAt
          ? new Date(updateOrderDto.deliveredAt)
          : null;
      } else if (
        updateOrderDto.orderStatus === OrderStatusEnum.DELIVERED &&
        !order.deliveredAt
      ) {
        order.deliveredAt = new Date();
      } else if (
        updateOrderDto.orderStatus &&
        updateOrderDto.orderStatus !== OrderStatusEnum.DELIVERED
      ) {
        order.deliveredAt = null;
      }

      if (
        updateOrderDto.orderStatus === OrderStatusEnum.READY &&
        !order.estimatedReadyAt
      ) {
        order.estimatedReadyAt = new Date();
      }

      if (!order.subtotalBeforeDiscount) {
        order.subtotalBeforeDiscount = Number(order.total ?? 0);
      }
      this.applyDiscount(order, updateOrderDto);

      const updatedOrder = await this.orderRepository.save(order);
      await this.syncDiningSessionAccountState(order.diningSession?.id);
      await this.syncTableOrderState(order.table.id);
      const orderWithRelations = await this.attachRelations(updatedOrder.id);

      await this.auditLogService.record({
        actor,
        action: 'order.updated',
        entityType: 'order',
        entityId: orderWithRelations.id,
        metadata: {
          orderStatus: orderWithRelations.orderStatus,
          discountAmount: orderWithRelations.discountAmount,
        },
      });

      await this.realtimeService.publishInternal('order.updated', {
        orderId: orderWithRelations.id,
        number: orderWithRelations.number,
        orderStatus: orderWithRelations.orderStatus,
        tableName: orderWithRelations.table?.name ?? null,
        sessionToken: orderWithRelations.diningSession?.sessionToken ?? null,
      });
      if (orderWithRelations.diningSession?.sessionToken) {
        await this.realtimeService.publishSession(
          orderWithRelations.diningSession.sessionToken,
          'order.updated',
          {
            orderId: orderWithRelations.id,
            number: orderWithRelations.number,
            orderStatus: orderWithRelations.orderStatus,
          },
        );
      }

      return {
        message: 'Pedido actualizado exitosamente',
        data: orderWithRelations,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string, actor = 'system01', reason?: string) {
    try {
      const order = await this.attachRelations(id);

      if (!order.state) {
        return {
          message: 'Pedido desactivado exitosamente',
          data: order,
        };
      }

      await this.restoreStockForOrder(order);

      order.state = false;
      order.status = 'inactive';
      order.deletedAt = new Date();
      order.cancelReason = reason?.trim() || null;
      order.cancelledAt = new Date();
      order.cancelledBy = actor;

      const deletedOrder = await this.orderRepository.save(order);
      await this.syncDiningSessionAccountState(order.diningSession?.id);
      await this.syncTableOrderState(order.table.id);
      const orderWithRelations = await this.attachRelations(deletedOrder.id);

      await this.auditLogService.record({
        actor,
        action: 'order.cancelled',
        entityType: 'order',
        entityId: orderWithRelations.id,
        metadata: {
          reason: orderWithRelations.cancelReason,
          number: orderWithRelations.number,
        },
      });

      await this.realtimeService.publishInternal('order.removed', {
        orderId: orderWithRelations.id,
        number: orderWithRelations.number,
        orderStatus: orderWithRelations.orderStatus,
        tableName: orderWithRelations.table?.name ?? null,
        sessionToken: orderWithRelations.diningSession?.sessionToken ?? null,
      });
      if (orderWithRelations.diningSession?.sessionToken) {
        await this.realtimeService.publishSession(
          orderWithRelations.diningSession.sessionToken,
          'order.removed',
          {
            orderId: orderWithRelations.id,
            number: orderWithRelations.number,
            orderStatus: orderWithRelations.orderStatus,
          },
        );
      }

      return {
        message: 'Pedido desactivado exitosamente',
        data: orderWithRelations,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
