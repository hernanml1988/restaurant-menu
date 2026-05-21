import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { Table } from './entities/table.entity';
import { TableController } from './table.controller';
import { TableService } from './table.service';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Restaurant]), SubscriptionModule],
  controllers: [TableController],
  providers: [TableService],
  exports: [TableService, TypeOrmModule],
})
export class TableModule {}
