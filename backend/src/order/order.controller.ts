import { Body, Controller, Post } from '@nestjs/common';
import { CreatePublicOrderDto } from './dto/create-public-order.dto';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('public')
  createPublicOrder(@Body() createPublicOrderDto: CreatePublicOrderDto) {
    return this.orderService.createPublicOrder(createPublicOrderDto);
  }
}
