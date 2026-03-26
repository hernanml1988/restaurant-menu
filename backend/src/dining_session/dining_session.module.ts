import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { Table } from '../table/entities/table.entity';
import { DiningSessionController } from './dining_session.controller';
import { DiningSessionService } from './dining_session.service';
import { DiningSession } from './entities/dining_session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiningSession, Table, Order])],
  controllers: [DiningSessionController],
  providers: [DiningSessionService],
  exports: [DiningSessionService, TypeOrmModule],
})
export class DiningSessionModule {}
