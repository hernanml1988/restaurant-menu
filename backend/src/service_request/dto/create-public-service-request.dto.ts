import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ServiceRequestTypeEnum } from '../entities/service_request.entity';

export class CreatePublicServiceRequestDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @IsEnum(ServiceRequestTypeEnum)
  type: ServiceRequestTypeEnum;

  @IsOptional()
  @IsString()
  notes?: string;
}
