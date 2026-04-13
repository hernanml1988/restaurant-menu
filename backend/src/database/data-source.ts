import 'reflect-metadata';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';
import { AuditLog } from '../audit_log/entities/audit_log.entity';
import { CashSession } from '../cash_session/entities/cash_session.entity';
import { Category } from '../category/entities/category.entity';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { FiscalDocument } from '../fiscal_document/entities/fiscal_document.entity';
import { OrderItemExtraSelection } from '../order/entities/order_item_extra_selection.entity';
import { OrderItem } from '../order/entities/order_item.entity';
import { OrderSequence } from '../order/entities/order_sequence.entity';
import { Order } from '../order/entities/order.entity';
import { Payment } from '../payment/entities/payment.entity';
import { ProductExtra } from '../product_extra/entities/product_extra.entity';
import { Product } from '../product/entities/product.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Receipt } from '../receipt/entities/receipt.entity';
import { RealtimeEvent } from '../realtime/entities/realtime_event.entity';
import { Reservation } from '../reservation/entities/reservation.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Role } from '../role/entities/role.entity';
import { ServiceRequest } from '../service_request/entities/service_request.entity';
import { Table } from '../table/entities/table.entity';
import { User } from '../user/entities/user.entity';

const appConfig = configuration();

export default new DataSource({
  type: 'postgres',
  host: appConfig.database.host,
  port: appConfig.database.port,
  username: appConfig.database.username,
  password: appConfig.database.password,
  database: appConfig.database.database,
  ssl: appConfig.database.ssl
    ? {
        rejectUnauthorized: appConfig.database.sslRejectUnauthorized,
      }
    : false,
  synchronize: false,
  migrationsRun: false,
  entities: [
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
    OrderSequence,
    ServiceRequest,
    Payment,
    Receipt,
    CashSession,
    AuditLog,
    Reservation,
    FiscalDocument,
    RealtimeEvent,
  ],
  migrations: ['src/database/migrations/*.ts'],
});
