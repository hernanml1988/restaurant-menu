import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { OrderItem } from '../order/entities/order_item.entity';
import { Order } from '../order/entities/order.entity';
import { Product } from '../product/entities/product.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Table } from '../table/entities/table.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      Order,
      OrderItem,
      Product,
      DiningSession,
      Table,
    ]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
