import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit_log/audit_log.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { Table } from '../table/entities/table.entity';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { Reservation } from './entities/reservation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Table]),
    RestaurantModule,
    AuditLogModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService, TypeOrmModule],
})
export class ReservationModule {}
