import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Product } from '../product/entities/product.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { Table } from '../table/entities/table.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order_item.entity';
import { OrderItemExtraSelection } from './entities/order_item_extra_selection.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderItemExtraSelection,
      DiningSession,
      Product,
      ProductExtra,
      Table,
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}
