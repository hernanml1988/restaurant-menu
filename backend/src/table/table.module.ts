import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { Table } from './entities/table.entity';
import { TableController } from './table.controller';
import { TableService } from './table.service';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Restaurant])],
  controllers: [TableController],
  providers: [TableService],
  exports: [TableService, TypeOrmModule],
})
export class TableModule {}
