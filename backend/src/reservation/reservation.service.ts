import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../audit_log/audit_log.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { Table } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Reservation } from './entities/reservation.entity';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    private readonly restaurantService: RestaurantService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private async resolveCurrentRestaurant() {
    return this.restaurantService.getCurrentRestaurantEntity();
  }

  private async resolveOptionalTable(tableId?: string) {
    if (!tableId) {
      return null;
    }

    const table = await this.tableRepository.findOne({
      where: { id: tableId, state: true },
      relations: {
        restaurant: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return table;
  }

  private async findEntity(id: string) {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: {
        restaurant: true,
        table: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async create(createReservationDto: CreateReservationDto, actor: string) {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      const table = await this.resolveOptionalTable(createReservationDto.tableId);
      const reservation = this.reservationRepository.create({
        guestName: createReservationDto.guestName.trim(),
        guestPhone: createReservationDto.guestPhone?.trim() || null,
        guestEmail: createReservationDto.guestEmail?.trim() || null,
        partySize: createReservationDto.partySize,
        reservationAt: new Date(createReservationDto.reservationAt),
        reservationStatus: createReservationDto.reservationStatus,
        notes: createReservationDto.notes?.trim() || null,
        restaurant,
        table,
        createdBy: actor,
        modifiedBy: actor,
      });

      const createdReservation = await this.reservationRepository.save(
        reservation,
      );

      await this.auditLogService.record({
        actor,
        action: 'reservation.created',
        entityType: 'reservation',
        entityId: createdReservation.id,
        metadata: {
          reservationAt: createdReservation.reservationAt,
          partySize: createdReservation.partySize,
        },
      });

      return {
        message: 'Reserva creada exitosamente',
        data: await this.findEntity(createdReservation.id),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const restaurant = await this.resolveCurrentRestaurant();
      return {
        message: 'Reservas obtenidas exitosamente',
        data: await this.reservationRepository.find({
          where: {
            restaurant: { id: restaurant.id },
            state: true,
          },
          relations: {
            restaurant: true,
            table: true,
          },
          order: {
            reservationAt: 'ASC',
          },
        }),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateReservationDto: UpdateReservationDto, actor: string) {
    try {
      const reservation = await this.findEntity(id);
      const table =
        updateReservationDto.tableId !== undefined
          ? await this.resolveOptionalTable(updateReservationDto.tableId)
          : reservation.table;

      Object.assign(reservation, {
        guestName: updateReservationDto.guestName?.trim() ?? reservation.guestName,
        guestPhone:
          updateReservationDto.guestPhone !== undefined
            ? updateReservationDto.guestPhone?.trim() || null
            : reservation.guestPhone,
        guestEmail:
          updateReservationDto.guestEmail !== undefined
            ? updateReservationDto.guestEmail?.trim() || null
            : reservation.guestEmail,
        partySize: updateReservationDto.partySize ?? reservation.partySize,
        reservationAt: updateReservationDto.reservationAt
          ? new Date(updateReservationDto.reservationAt)
          : reservation.reservationAt,
        reservationStatus:
          updateReservationDto.reservationStatus ?? reservation.reservationStatus,
        notes:
          updateReservationDto.notes !== undefined
            ? updateReservationDto.notes?.trim() || null
            : reservation.notes,
        table,
        modifiedBy: actor,
      });

      const updatedReservation = await this.reservationRepository.save(
        reservation,
      );

      await this.auditLogService.record({
        actor,
        action: 'reservation.updated',
        entityType: 'reservation',
        entityId: updatedReservation.id,
        metadata: {
          reservationStatus: updatedReservation.reservationStatus,
          tableId: updatedReservation.table?.id ?? null,
        },
      });

      return {
        message: 'Reserva actualizada exitosamente',
        data: await this.findEntity(updatedReservation.id),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string, actor: string) {
    try {
      const reservation = await this.findEntity(id);
      reservation.state = false;
      reservation.deletedAt = new Date();
      reservation.modifiedBy = actor;
      const deletedReservation = await this.reservationRepository.save(
        reservation,
      );

      await this.auditLogService.record({
        actor,
        action: 'reservation.removed',
        entityType: 'reservation',
        entityId: deletedReservation.id,
      });

      return {
        message: 'Reserva desactivada exitosamente',
        data: deletedReservation,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
