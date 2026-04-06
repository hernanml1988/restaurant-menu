import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Restaurant } from '../restaurant/entities/restaurant.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { Table } from './entities/table.entity';
import { extractTableQrToken, matchesTableQrValue } from './table-qr.utils';
import Utils from '../utils/errorUtils';

@Injectable()
export class TableService {
  private readonly logger = new Logger(TableService.name);

  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    private readonly configService: ConfigService,
  ) {}

  private generateQrCodePayload(
    restaurantId: string,
    tableNumber: number,
    tableName: string,
  ) {
    const frontendPublicUrl = this.configService.get<string>(
      'frontend.publicUrl',
    );

    if (!frontendPublicUrl) {
      throw new InternalServerErrorException(
        'FRONTEND_PUBLIC_URL is not configured',
      );
    }

    const slugName = tableName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const tableToken = `table:${restaurantId}:${tableNumber}:${slugName || 'mesa'}:${randomUUID()}`;
    const normalizedFrontendPublicUrl = frontendPublicUrl.replace(/\/+$/, '');
    const qrCode = `${normalizedFrontendPublicUrl}/cliente/bienvenida?qr=${encodeURIComponent(tableToken)}`;

    this.logger.log(
      `[generateQrCodePayload] restaurantId=${restaurantId} tableNumber=${tableNumber} tableName="${tableName}" frontendPublicUrl="${normalizedFrontendPublicUrl}" tableToken="${tableToken}" qrCode="${qrCode}"`,
    );

    return qrCode;
  }

  async findActiveTableByQrValue(qrValue: string) {
    const incomingToken = extractTableQrToken(qrValue);

    this.logger.log(
      `[findActiveTableByQrValue] incomingQrValue="${qrValue}" incomingToken="${incomingToken}"`,
    );

    const activeTables = await this.tableRepository.find({
      where: {
        state: true,
      },
      relations: {
        restaurant: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    this.logger.log(
      `[findActiveTableByQrValue] activeTables=${activeTables.length}`,
    );

    for (const table of activeTables) {
      const storedToken = extractTableQrToken(table.qrCode);
      const isMatch = matchesTableQrValue(table.qrCode, qrValue);

      this.logger.log(
        `[findActiveTableByQrValue] checkingTable id=${table.id} number=${table.number} state=${table.state} storedQrCode="${table.qrCode}" storedToken="${storedToken}" match=${isMatch}`,
      );

      if (isMatch) {
        this.logger.log(
          `[findActiveTableByQrValue] matchedTable id=${table.id} number=${table.number} name="${table.name}"`,
        );

        return table;
      }
    }

    this.logger.warn(
      `[findActiveTableByQrValue] noTableMatched incomingQrValue="${qrValue}" incomingToken="${incomingToken}"`,
    );

    return null;
  }

  async create(createTableDto: CreateTableDto) {
    try {
      this.logger.log(
        `[create] payload restaurantId=${createTableDto.restaurantId} number=${createTableDto.number} name="${createTableDto.name}" zone="${createTableDto.zone}" capacity=${createTableDto.capacity} providedQrCode="${createTableDto.qrCode ?? ''}"`,
      );

      const restaurant = await this.restaurantRepository.findOne({
        where: { id: createTableDto.restaurantId },
      });

      if (!restaurant) {
        throw new NotFoundException('Restaurant not found');
      }

      const qrCode =
        createTableDto.qrCode ??
        this.generateQrCodePayload(
          restaurant.id,
          createTableDto.number,
          createTableDto.name,
        );

      this.logger.log(
        `[create] resolvedQrCode restaurantId=${restaurant.id} qrCode="${qrCode}" qrToken="${extractTableQrToken(qrCode)}"`,
      );

      const existingTable = await this.tableRepository.findOne({
        where: { qrCode },
      });

      if (existingTable) {
        throw new ConflictException('QR code already exists');
      }

      const table = this.tableRepository.create({
        number: createTableDto.number,
        name: createTableDto.name,
        capacity: createTableDto.capacity,
        zone: createTableDto.zone,
        qrCode,
        serviceStatus: createTableDto.serviceStatus,
        activeOrders: createTableDto.activeOrders ?? 0,
        state: createTableDto.state ?? true,
        restaurant,
      });

      const newTable = await this.tableRepository.save(table);

      this.logger.log(
        `[create] tableCreated id=${newTable.id} number=${newTable.number} name="${newTable.name}" state=${newTable.state} qrCode="${newTable.qrCode}" qrToken="${extractTableQrToken(newTable.qrCode)}"`,
      );

      return {
        message: 'Mesa creada exitosamente',
        data: newTable,
      };
    } catch (error) {
      this.logger.error(
        `[create] failed payloadRestaurantId=${createTableDto.restaurantId} payloadNumber=${createTableDto.number} payloadName="${createTableDto.name}" message="${error.message}"`,
        error.stack,
      );
      Utils.errorResponse(error);
    }
  }

  async findByQrCode(qrCode: string) {
    try {
      this.logger.log(
        `[findByQrCode] receivedQrCode="${qrCode}" qrToken="${extractTableQrToken(qrCode)}"`,
      );

      const table = await this.findActiveTableByQrValue(qrCode);

      if (!table) {
        throw new NotFoundException('Table not found');
      }

      this.logger.log(
        `[findByQrCode] tableFound id=${table.id} number=${table.number} name="${table.name}" qrCode="${table.qrCode}"`,
      );

      return {
        message: 'Mesa obtenida exitosamente por QR',
        data: table,
      };
    } catch (error) {
      this.logger.error(
        `[findByQrCode] failed qrCode="${qrCode}" qrToken="${extractTableQrToken(qrCode)}" message="${error.message}"`,
        error.stack,
      );
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
      this.logger.error(
        `[findAll] failed message="${error.message}"`,
        error.stack,
      );
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
      this.logger.error(
        `[findOne] failed id=${id} message="${error.message}"`,
        error.stack,
      );
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
      this.logger.error(
        `[update] failed id=${id} message="${error.message}"`,
        error.stack,
      );
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
      this.logger.error(
        `[remove] failed id=${id} message="${error.message}"`,
        error.stack,
      );
      Utils.errorResponse(error);
    }
  }
}
