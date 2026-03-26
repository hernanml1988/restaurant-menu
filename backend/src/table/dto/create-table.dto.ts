import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TableStatusEnum } from '../entities/table.entity';

export class CreateTableDto {
  @IsUUID()
  restaurantId: string;

  @IsInt()
  @Min(1)
  number: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsPositive()
  capacity: number;

  @IsString()
  @IsNotEmpty()
  zone: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  qrCode?: string;

  @IsOptional()
  @IsEnum(TableStatusEnum)
  serviceStatus?: TableStatusEnum;

  @IsOptional()
  @IsInt()
  @Min(0)
  activeOrders?: number;

  @IsOptional()
  @IsBoolean()
  state?: boolean;
}
