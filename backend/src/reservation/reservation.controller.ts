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
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationService } from './reservation.service';

@Controller('reservation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@InternalRoles('admin')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  findAll() {
    return this.reservationService.findAll();
  }

  @Post()
  create(@Body() createReservationDto: CreateReservationDto, @Req() req: Request) {
    const actor = (req.user as any)?.username || (req.user as any)?.userId;
    return this.reservationService.create(createReservationDto, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Req() req: Request,
  ) {
    const actor = (req.user as any)?.username || (req.user as any)?.userId;
    return this.reservationService.update(id, updateReservationDto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    const actor = (req.user as any)?.username || (req.user as any)?.userId;
    return this.reservationService.remove(id, actor);
  }
}
