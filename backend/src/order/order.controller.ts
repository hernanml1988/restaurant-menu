import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('public')
  createPublicOrder(@Body() createPublicOrderDto: CreatePublicOrderDto) {
    return this.orderService.createPublicOrder(createPublicOrderDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  findAll() {
    return this.orderService.findAll();
  }

  @Get('kitchen/board')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin', 'kitchen')
  findKitchenBoard() {
    return this.orderService.findKitchenBoard();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin', 'kitchen')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin', 'kitchen')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req: Request,
  ) {
    return this.orderService.update(
      id,
      updateOrderDto,
      (req.user as any)?.username || (req.user as any)?.userId || 'system01',
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  remove(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
    @Req() req: Request,
  ) {
    return this.orderService.remove(
      id,
      (req.user as any)?.username || (req.user as any)?.userId || 'system01',
      cancelOrderDto.reason,
    );
  }
}
