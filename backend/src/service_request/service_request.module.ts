import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiningSession } from '../dining_session/entities/dining_session.entity';
import { Table } from '../table/entities/table.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { ServiceRequest } from './entities/service_request.entity';
import { ServiceRequestController } from './service_request.controller';
import { ServiceRequestService } from './service_request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest, DiningSession, Table]),
    RealtimeModule,
    RestaurantModule,
  ],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService, TypeOrmModule],
})
export class ServiceRequestModule {}
