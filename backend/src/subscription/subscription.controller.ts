import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { LimitKindEnum } from './dto/check-limit.dto';
import { SubscriptionService } from './subscription.service';

@Controller('subscriptions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@InternalRoles('admin')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('plans')
  async listPlans() {
    return {
      message: 'Planes obtenidos exitosamente',
      data: await this.subscriptionService.listPlans(),
    };
  }

  @Get('restaurant/:restaurantId')
  async getRestaurantSubscription(@Param('restaurantId') restaurantId: string) {
    return {
      message: 'Suscripcion obtenida exitosamente',
      data: await this.subscriptionService.getOrCreateActiveSubscription(restaurantId),
    };
  }

  @Patch('restaurant/:restaurantId/plan/:planCode')
  async changePlan(
    @Param('restaurantId') restaurantId: string,
    @Param('planCode') planCode: string,
  ) {
    return {
      message: 'Plan actualizado exitosamente',
      data: await this.subscriptionService.changeRestaurantPlan(restaurantId, planCode),
    };
  }

  @Post('restaurant/:restaurantId/check/:kind')
  async checkLimit(
    @Param('restaurantId') restaurantId: string,
    @Param('kind') kind: LimitKindEnum,
  ) {
    return {
      message: 'Limite validado exitosamente',
      data: await this.subscriptionService.checkLimit(restaurantId, kind),
    };
  }
}
