import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { RestaurantStaff } from '../restaurant_staff/entities/restaurant_staff.entity';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports:[
    TypeOrmModule.forFeature([
      User,
      Role,
      Profile,
      ProfileRole,
      Restaurant,
      RestaurantStaff,
    ]),
    RestaurantModule,
    SubscriptionModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports:[TypeOrmModule, UserService]
})
export class UserModule {}
