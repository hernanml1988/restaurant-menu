import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit_log/audit_log.module';
import { CashSession } from '../cash_session/entities/cash_session.entity';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Product } from '../product/entities/product.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { Table } from '../table/entities/table.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderSequence } from './entities/order_sequence.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order_item.entity';
import { OrderItemExtraSelection } from './entities/order_item_extra_selection.entity';

@Module({
  imports: [
    RealtimeModule,
    AuditLogModule,
    TypeOrmModule.forFeature([
      Order,
      OrderSequence,
      OrderItem,
      OrderItemExtraSelection,
      DiningSession,
      CashSession,
      Product,
      ProductExtra,
      Table,
      Payment,
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}
