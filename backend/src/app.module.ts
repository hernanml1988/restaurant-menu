import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { User } from './user/entities/user.entity';
import { RoleModule } from './role/role.module';
import { Role } from './role/entities/role.entity';
import { ProfileModule } from './profile/profile.module';
import { Profile } from './profile/entities/profile.entity';
import { ProfileRoleModule } from './profile_role/profile_role.module';
import { ProfileRole } from './profile_role/entities/profile_role.entity';
import { AuthModule } from './auth/auth.module';
import { Restaurant } from './restaurant/entities/restaurant.entity';
import { Table } from './table/entities/table.entity';
import { Category } from './category/entities/category.entity';
import { Product } from './product/entities/product.entity';
import { ProductExtra } from './product_extra/entities/product_extra.entity';
import { DiningSession } from './dining_session/entities/dining_session.entity';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order_item.entity';
import { OrderItemExtraSelection } from './order/entities/order_item_extra_selection.entity';
import { ServiceRequest } from './service_request/entities/service_request.entity';
import { RestaurantModule } from './restaurant/restaurant.module';
import { TableModule } from './table/table.module';
import { DiningSessionModule } from './dining_session/dining_session.module';
import { OrderModule } from './order/order.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
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
          ServiceRequest,
        ],
        synchronize: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
