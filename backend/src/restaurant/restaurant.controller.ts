import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateRestaurantProfileDto } from './dto/update-restaurant-profile.dto';
import { RestaurantService } from './restaurant.service';

@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get('public/current')
  findPublicCurrent() {
    return this.restaurantService.findCurrent();
  }

  @Get('current')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  findCurrent() {
    return this.restaurantService.findCurrent();
  }

  @Patch('current')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  updateCurrent(@Body() updateRestaurantProfileDto: UpdateRestaurantProfileDto) {
    return this.restaurantService.updateCurrent(updateRestaurantProfileDto);
  }

  @Post('current/reset')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  resetCurrent() {
    return this.restaurantService.resetCurrent();
  }
}
