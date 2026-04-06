import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DiningSession,
  DiningSessionAccountStatusEnum,
} from '../dining_session/entities/dining_session.entity';
import { RealtimeService } from '../realtime/realtime.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { Table, TableStatusEnum } from '../table/entities/table.entity';
import Utils from '../utils/errorUtils';
import { CreatePublicServiceRequestDto } from './dto/create-public-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import {
  ServiceRequest,
  ServiceRequestStatusEnum,
  ServiceRequestTypeEnum,
} from './entities/service_request.entity';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectRepository(ServiceRequest)
    private readonly serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(DiningSession)
    private readonly diningSessionRepository: Repository<DiningSession>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    private readonly restaurantService: RestaurantService,
    private readonly realtimeService: RealtimeService,
  ) {}

  private async attachRelations(serviceRequestId: string) {
    const serviceRequest = await this.serviceRequestRepository.findOne({
      where: { id: serviceRequestId },
      relations: {
        restaurant: true,
        table: true,
        diningSession: true,
      },
    });

    if (!serviceRequest) {
      throw new NotFoundException('Service request not found');
    }

    return serviceRequest;
  }

  async findAllInternal() {
    try {
      const restaurant = await this.restaurantService.getCurrentRestaurantEntity();
      const serviceRequests = await this.serviceRequestRepository.find({
        where: {
          restaurant: {
            id: restaurant.id,
          },
        },
        relations: {
          restaurant: true,
          table: true,
          diningSession: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        message: 'Solicitudes de servicio obtenidas exitosamente',
        data: serviceRequests,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async createPublic(createPublicServiceRequestDto: CreatePublicServiceRequestDto) {
    try {
      const diningSession = await this.diningSessionRepository.findOne({
        where: {
          sessionToken: createPublicServiceRequestDto.sessionToken,
          active: true,
          state: true,
        },
        relations: {
          restaurant: true,
          table: true,
        },
      });

      if (!diningSession) {
        throw new NotFoundException('Dining session not found');
      }

      const serviceRequest = this.serviceRequestRepository.create({
        type: createPublicServiceRequestDto.type,
        requestStatus: ServiceRequestStatusEnum.PENDING,
        notes: createPublicServiceRequestDto.notes?.trim() || null,
        restaurant: diningSession.restaurant,
        table: diningSession.table,
        diningSession,
      });

      const createdRequest = await this.serviceRequestRepository.save(serviceRequest);
      const serviceRequestWithRelations = await this.attachRelations(createdRequest.id);

      if (serviceRequestWithRelations.type === ServiceRequestTypeEnum.BILL) {
        diningSession.accountStatus = DiningSessionAccountStatusEnum.PAYMENT_PENDING;
        diningSession.modifiedBy = 'client-session';
        await this.diningSessionRepository.save(diningSession);

        if (diningSession.table) {
          diningSession.table.serviceStatus = TableStatusEnum.PENDING_PAYMENT;
          await this.tableRepository.save(diningSession.table);
        }
      }

      this.realtimeService.publishInternal('service-request.created', {
        serviceRequestId: serviceRequestWithRelations.id,
        requestStatus: serviceRequestWithRelations.requestStatus,
        type: serviceRequestWithRelations.type,
        tableName: serviceRequestWithRelations.table?.name ?? null,
        sessionToken: serviceRequestWithRelations.diningSession?.sessionToken ?? null,
      });

      return {
        message: 'Solicitud de servicio creada exitosamente',
        data: serviceRequestWithRelations,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async updateInternal(id: string, updateServiceRequestDto: UpdateServiceRequestDto) {
    try {
      const serviceRequest = await this.attachRelations(id);

      if (updateServiceRequestDto.requestStatus) {
        serviceRequest.requestStatus = updateServiceRequestDto.requestStatus;
        serviceRequest.attendedAt =
          updateServiceRequestDto.requestStatus === ServiceRequestStatusEnum.ATTENDED
            ? new Date()
            : null;
      }

      if (updateServiceRequestDto.notes !== undefined) {
        const notes = updateServiceRequestDto.notes.trim();
        serviceRequest.notes = notes ? notes : null;
      }

      const updatedRequest = await this.serviceRequestRepository.save(serviceRequest);
      const requestWithRelations = await this.attachRelations(updatedRequest.id);

      this.realtimeService.publishInternal('service-request.updated', {
        serviceRequestId: requestWithRelations.id,
        requestStatus: requestWithRelations.requestStatus,
        type: requestWithRelations.type,
        tableName: requestWithRelations.table?.name ?? null,
        sessionToken: requestWithRelations.diningSession?.sessionToken ?? null,
      });

      return {
        message: 'Solicitud de servicio actualizada exitosamente',
        data: requestWithRelations,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
