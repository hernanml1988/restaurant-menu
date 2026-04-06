import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CancelPaymentDto } from './dto/cancel-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@InternalRoles('admin')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto, @Req() req: Request) {
    return this.paymentService.create(
      createPaymentDto,
      (req.user as any)?.username || (req.user as any)?.userId || 'system01',
    );
  }

  @Get('session/:sessionToken')
  findBySessionToken(@Param('sessionToken') sessionToken: string) {
    return this.paymentService.findBySessionToken(sessionToken);
  }

  @Delete(':id')
  cancel(
    @Param('id') id: string,
    @Body() cancelPaymentDto: CancelPaymentDto,
    @Req() req: Request,
  ) {
    return this.paymentService.cancel(
      id,
      cancelPaymentDto,
      (req.user as any)?.username || (req.user as any)?.userId || 'system01',
    );
  }
}
