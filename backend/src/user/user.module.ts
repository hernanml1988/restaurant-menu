import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Table } from '../table/entities/table.entity';
import { Category } from '../category/entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order_item.entity';
import { OrderItemExtraSelection } from '../order/entities/order_item_extra_selection.entity';
import { Payment } from '../payment/entities/payment.entity';
import { ServiceRequest } from '../service_request/entities/service_request.entity';
import { CashSession } from '../cash_session/entities/cash_session.entity';
import { Receipt } from '../receipt/entities/receipt.entity';
import { FiscalDocument } from '../fiscal_document/entities/fiscal_document.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { AuditLog } from '../audit_log/entities/audit_log.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      User,
      Role,
      Profile,
      ProfileRole,
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
      Payment,
      CashSession,
      Receipt,
      FiscalDocument,
      Reservation,
      AuditLog,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports:[TypeOrmModule]
})
export class UserModule {}
