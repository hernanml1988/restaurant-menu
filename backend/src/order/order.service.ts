import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Product } from '../product/entities/product.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { Table, TableStatusEnum } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import {
  Order,
  OrderPriorityEnum,
  OrderStatusEnum,
} from './entities/order.entity';
import { OrderItem } from './entities/order_item.entity';
import { OrderItemExtraSelection } from './entities/order_item_extra_selection.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}

  private async getNextOrderNumber() {
    const rawResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(MAX(order.number), 0)', 'max')
      .getRawOne<{ max: string }>();

    return Number(rawResult?.max ?? 0) + 1;
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
        throw new NotFoundException(
          `Product not found: ${itemDto.productId}`,
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

      const orderNumber = await this.getNextOrderNumber();
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
            number: orderNumber,
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
          createdOrder.total = await this.createOrderItems(
            manager,
            createdOrder,
            createPublicOrderDto,
            diningSession,
          );

          return orderRepository.save(createdOrder);
        },
      );

      const table = diningSession.table;
      table.activeOrders = await this.orderRepository.count({
        where: {
          table: { id: table.id },
          diningSession: {
            active: true,
          },
        },
      });
      table.serviceStatus = TableStatusEnum.WITH_ORDER;
      await this.tableRepository.save(table);

      const createdOrder = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
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
      });

      return {
        message: 'Pedido creado exitosamente',
        data: createdOrder,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
