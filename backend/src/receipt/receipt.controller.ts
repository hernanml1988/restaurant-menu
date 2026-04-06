import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { ReceiptService } from './receipt.service';

@Controller('receipt')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@InternalRoles('admin')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get()
  findAll() {
    return this.receiptService.findAll();
  }

  @Post()
  create(@Body() createReceiptDto: CreateReceiptDto, @Req() req: Request) {
    const actor = (req.user as any)?.username || (req.user as any)?.userId;
    return this.receiptService.create(createReceiptDto, actor);
  }
}
