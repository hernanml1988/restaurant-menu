import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Table } from './entities/table.entity';
import Utils from '../utils/errorUtils';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(createTableDto: CreateTableDto) {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: createTableDto.restaurantId },
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      const existingTable = await this.tableRepository.findOne({
        where: { qrCode: createTableDto.qrCode },
      });

      if (existingTable) {
        throw new ConflictException('QR code already exists');
      }

      const table = this.tableRepository.create({
        number: createTableDto.number,
        name: createTableDto.name,
        capacity: createTableDto.capacity,
        zone: createTableDto.zone,
        qrCode: createTableDto.qrCode,
        serviceStatus: createTableDto.serviceStatus,
        activeOrders: createTableDto.activeOrders ?? 0,
        state: createTableDto.state ?? true,
        restaurant,
      });

      const newTable = await this.tableRepository.save(table);

      return {
        message: 'Mesa creada exitosamente',
        data: newTable,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const tables = await this.tableRepository.find({
        relations: {
          restaurant: true,
        },
        order: {
          number: 'ASC',
        },
      });

      return {
        message: 'Mesas obtenidas exitosamente',
        data: tables,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findOne(id: string) {
    try {
      const table = await this.tableRepository.findOne({
        where: { id },
        relations: {
          restaurant: true,
        },
      });

      if (!table) {
        throw new NotFoundException('Table not found');
      }

      return {
        message: 'Mesa obtenida exitosamente',
        data: table,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateTableDto: UpdateTableDto) {
    try {
      const table = await this.tableRepository.findOne({
        where: { id },
        relations: {
          restaurant: true,
        },
      });

      if (!table) {
        throw new NotFoundException('Table not found');
      }

      if (updateTableDto.restaurantId) {
        const restaurant = await this.restaurantRepository.findOne({
          where: { id: updateTableDto.restaurantId },
        });

        if (!restaurant) {
          throw new NotFoundException('Restaurant not found');
        }

        table.restaurant = restaurant;
      }

      if (
        updateTableDto.qrCode &&
        updateTableDto.qrCode !== table.qrCode
      ) {
        const existingTable = await this.tableRepository.findOne({
          where: { qrCode: updateTableDto.qrCode },
        });

        if (existingTable && existingTable.id !== table.id) {
          throw new ConflictException('QR code already exists');
        }
      }

      Object.assign(table, {
        number: updateTableDto.number ?? table.number,
        name: updateTableDto.name ?? table.name,
        capacity: updateTableDto.capacity ?? table.capacity,
        zone: updateTableDto.zone ?? table.zone,
        qrCode: updateTableDto.qrCode ?? table.qrCode,
        serviceStatus: updateTableDto.serviceStatus ?? table.serviceStatus,
        activeOrders: updateTableDto.activeOrders ?? table.activeOrders,
        state: updateTableDto.state ?? table.state,
      });

      const updatedTable = await this.tableRepository.save(table);

      return {
        message: 'Mesa actualizada exitosamente',
        data: updatedTable,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string) {
    try {
      const table = await this.tableRepository.findOne({
        where: { id },
      });

      if (!table) {
        throw new NotFoundException('Table not found');
      }

      table.state = false;
      await this.tableRepository.save(table);

      return {
        message: 'Mesa desactivada exitosamente',
        data: table,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
