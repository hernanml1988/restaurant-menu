import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../category/entities/category.entity';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { OrderItemExtraSelection } from '../order/entities/order_item_extra_selection.entity';
import { OrderItem } from '../order/entities/order_item.entity';
import { Order } from '../order/entities/order.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { Product } from '../product/entities/product.entity';
import { ServiceRequest } from '../service_request/entities/service_request.entity';
import { Table } from '../table/entities/table.entity';
import { RestaurantController } from './restaurant.controller';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      Table,
      Category,
      Product,
      ProductExtra,
      DiningSession,
      Order,
      OrderItem,
      OrderItemExtraSelection,
      ServiceRequest,
    ]),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService],
  exports: [RestaurantService, TypeOrmModule],
})
export class RestaurantModule {}
