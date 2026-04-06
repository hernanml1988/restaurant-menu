import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './audit_log/audit_log.module';
import { AuditLog } from './audit_log/entities/audit_log.entity';
import { AuthModule } from './auth/auth.module';
import { CashSessionModule } from './cash_session/cash_session.module';
import { CashSession } from './cash_session/entities/cash_session.entity';
import { CategoryModule } from './category/category.module';
import { Category } from './category/entities/category.entity';
import configuration from './config/configuration';
import { DiningSessionModule } from './dining_session/dining_session.module';
import { DiningSession } from './dining_session/entities/dining_session.entity';
import { FiscalDocumentModule } from './fiscal_document/fiscal_document.module';
import { FiscalDocument } from './fiscal_document/entities/fiscal_document.entity';
import { OrderModule } from './order/order.module';
import { OrderItemExtraSelection } from './order/entities/order_item_extra_selection.entity';
import { OrderItem } from './order/entities/order_item.entity';
import { OrderSequence } from './order/entities/order_sequence.entity';
import { Order } from './order/entities/order.entity';
import { PaymentModule } from './payment/payment.module';
import { Payment } from './payment/entities/payment.entity';
import { ProductModule } from './product/product.module';
import { ProductExtra } from './product_extra/entities/product_extra.entity';
import { Product } from './product/entities/product.entity';
import { ProfileModule } from './profile/profile.module';
import { ProfileRoleModule } from './profile_role/profile_role.module';
import { ProfileRole } from './profile_role/entities/profile_role.entity';
import { Profile } from './profile/entities/profile.entity';
import { ReceiptModule } from './receipt/receipt.module';
import { Receipt } from './receipt/entities/receipt.entity';
import { RealtimeModule } from './realtime/realtime.module';
import { RealtimeEvent } from './realtime/entities/realtime_event.entity';
import { ReportModule } from './report/report.module';
import { ReservationModule } from './reservation/reservation.module';
import { Reservation } from './reservation/entities/reservation.entity';
import { RestaurantModule } from './restaurant/restaurant.module';
import { Restaurant } from './restaurant/entities/restaurant.entity';
import { RoleModule } from './role/role.module';
import { Role } from './role/entities/role.entity';
import { ServiceRequestModule } from './service_request/service_request.module';
import { ServiceRequest } from './service_request/entities/service_request.entity';
import { TableModule } from './table/table.module';
import { Table } from './table/entities/table.entity';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';

const appEntities = [
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
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: appEntities,
        synchronize: configService.get<boolean>('database.synchronize'),
        migrationsRun: configService.get<boolean>('database.migrationsRun'),
        migrations: ['dist/src/database/migrations/*.js'],
      }),
    }),
    UserModule,
    RoleModule,
    ProfileModule,
    ProfileRoleModule,
    AuthModule,
    RestaurantModule,
    TableModule,
    CategoryModule,
    ProductModule,
    DiningSessionModule,
    OrderModule,
    ServiceRequestModule,
    ReportModule,
    RealtimeModule,
    PaymentModule,
    ReceiptModule,
    CashSessionModule,
    AuditLogModule,
    ReservationModule,
    FiscalDocumentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
