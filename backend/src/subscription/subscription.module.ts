import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entities/product.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RestaurantStaff } from '../restaurant_staff/entities/restaurant_staff.entity';
import { Table } from '../table/entities/table.entity';
import { Plan } from './entities/plan.entity';
import { RestaurantSubscription } from './entities/restaurant-subscription.entity';
import { UsageCounter } from './entities/usage-counter.entity';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      RestaurantSubscription,
      UsageCounter,
      Restaurant,
      RestaurantStaff,
      Product,
      Table,
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService, TypeOrmModule],
})
export class SubscriptionModule {}
