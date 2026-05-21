import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RestaurantService } from '../restaurant/restaurant.service';
import { RestaurantStaff } from '../restaurant_staff/entities/restaurant_staff.entity';
import { Role } from '../role/entities/role.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(Profile), useValue: {} },
        { provide: getRepositoryToken(ProfileRole), useValue: {} },
        { provide: getRepositoryToken(Restaurant), useValue: {} },
        { provide: getRepositoryToken(RestaurantStaff), useValue: {} },
        { provide: RestaurantService, useValue: {} },
        { provide: SubscriptionService, useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
