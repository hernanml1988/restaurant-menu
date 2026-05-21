import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { RestaurantStaff } from '../restaurant_staff/entities/restaurant_staff.entity';
import { Product } from '../product/entities/product.entity';
import { Table } from '../table/entities/table.entity';
import { Plan } from './entities/plan.entity';
import {
  RestaurantSubscription,
  SubscriptionStatusEnum,
} from './entities/restaurant-subscription.entity';
import { LimitKindEnum } from './dto/check-limit.dto';

@Injectable()
export class SubscriptionService implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(RestaurantSubscription)
    private readonly subscriptionRepository: Repository<RestaurantSubscription>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(RestaurantStaff)
    private readonly restaurantStaffRepository: Repository<RestaurantStaff>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}

  async onModuleInit() {
    const hasPlans = await this.dataSource.query(
      `SELECT to_regclass('public.plans') as "tableName"`,
    );
    if (!hasPlans?.[0]?.tableName) {
      return;
    }

    await this.seedDefaultPlans();
  }

  private async seedDefaultPlans() {
    const defaults: Array<Partial<Plan>> = [
      {
        code: 'basic',
        name: 'Plan Basico',
        description: 'Administrativo',
        includeKitchen: false,
        includeQr: false,
        maxStaff: 2,
        maxProducts: 60,
        maxProductsWithImage: 20,
        maxTables: 10,
        softMaxTables: 10,
      },
      {
        code: 'operation',
        name: 'Plan Operacion',
        description: 'Admin + Cocina',
        includeKitchen: true,
        includeQr: false,
        maxStaff: 10,
        maxProducts: 200,
        maxProductsWithImage: 100,
        maxTables: 40,
        softMaxTables: 40,
      },
      {
        code: 'full',
        name: 'Plan Full',
        description: 'Admin + Cocina + QR',
        includeKitchen: true,
        includeQr: true,
        maxStaff: 30,
        maxProducts: 600,
        softMaxProducts: 750,
        maxProductsWithImage: 400,
        maxTables: 100,
      },
    ];

    for (const planData of defaults) {
      const existing = await this.planRepository.findOne({
        where: { code: planData.code },
      });

      if (!existing) {
        await this.planRepository.save(this.planRepository.create(planData));
      }
    }
  }

  async getOrCreateActiveSubscription(restaurantId: string) {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, state: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const existing = await this.subscriptionRepository.findOne({
      where: {
        restaurant: { id: restaurantId },
        state: true,
      },
      relations: {
        plan: true,
        restaurant: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (existing) {
      return existing;
    }

    const basicPlan = await this.planRepository.findOne({
      where: { code: 'basic', state: true },
    });

    if (!basicPlan) {
      throw new NotFoundException('Default basic plan not found');
    }

    const created = this.subscriptionRepository.create({
      restaurant,
      plan: basicPlan,
      status: SubscriptionStatusEnum.ACTIVE,
      state: true,
    });

    return this.subscriptionRepository.save(created);
  }

  async listPlans() {
    return this.planRepository.find({ where: { state: true }, order: { createdAt: 'ASC' } });
  }

  async changeRestaurantPlan(restaurantId: string, planCode: string) {
    const plan = await this.planRepository.findOne({ where: { code: planCode, state: true } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const current = await this.getOrCreateActiveSubscription(restaurantId);
    current.plan = plan;
    current.status = SubscriptionStatusEnum.ACTIVE;
    current.state = true;

    return this.subscriptionRepository.save(current);
  }

  private async getCurrentUsage(restaurantId: string, kind: LimitKindEnum) {
    if (kind === LimitKindEnum.STAFF) {
      return this.restaurantStaffRepository.count({
        where: { restaurant: { id: restaurantId }, state: true },
      });
    }

    if (kind === LimitKindEnum.PRODUCTS) {
      return this.productRepository.count({
        where: { restaurant: { id: restaurantId }, state: true },
      });
    }

    if (kind === LimitKindEnum.PRODUCTS_WITH_IMAGE) {
      return this.productRepository
        .createQueryBuilder('product')
        .where('product.state = true')
        .andWhere('product."restaurantId" = :restaurantId', { restaurantId })
        .andWhere('product.image is not null')
        .andWhere("trim(product.image) <> ''")
        .getCount();
    }

    return this.tableRepository.count({
      where: { restaurant: { id: restaurantId }, state: true },
    });
  }

  private resolveLimits(plan: Plan, kind: LimitKindEnum) {
    switch (kind) {
      case LimitKindEnum.STAFF:
        return { hard: plan.maxStaff, soft: null };
      case LimitKindEnum.PRODUCTS:
        return { hard: plan.maxProducts, soft: plan.softMaxProducts };
      case LimitKindEnum.PRODUCTS_WITH_IMAGE:
        return { hard: plan.maxProductsWithImage, soft: null };
      default:
        return { hard: plan.maxTables, soft: plan.softMaxTables };
    }
  }

  async checkLimit(restaurantId: string, kind: LimitKindEnum, increment = 1) {
    const subscription = await this.getOrCreateActiveSubscription(restaurantId);

    if (subscription.status !== SubscriptionStatusEnum.ACTIVE && subscription.status !== SubscriptionStatusEnum.TRIAL) {
      throw new BadRequestException('La suscripcion no permite operar en este momento.');
    }

    const usage = await this.getCurrentUsage(restaurantId, kind);
    const { hard, soft } = this.resolveLimits(subscription.plan, kind);
    const nextUsage = usage + increment;

    if (hard > 0 && nextUsage > hard) {
      throw new BadRequestException(
        `Limite del plan excedido para ${kind}. Uso actual ${usage}, limite ${hard}.`,
      );
    }

    return {
      allowed: true,
      warning: !!soft && nextUsage > soft,
      usage,
      nextUsage,
      hard,
      soft,
      planCode: subscription.plan.code,
    };
  }
}
