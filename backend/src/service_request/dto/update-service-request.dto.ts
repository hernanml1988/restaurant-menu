import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ServiceRequestStatusEnum } from '../entities/service_request.entity';

export class UpdateServiceRequestDto {
  @IsOptional()
  @IsEnum(ServiceRequestStatusEnum)
  requestStatus?: ServiceRequestStatusEnum;

  @IsOptional()
  @IsString()
  notes?: string;
}
