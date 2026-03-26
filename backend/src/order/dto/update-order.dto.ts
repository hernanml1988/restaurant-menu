import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  OrderPriorityEnum,
  OrderStationEnum,
  OrderStatusEnum,
} from '../entities/order.entity';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatusEnum)
  orderStatus?: OrderStatusEnum;

  @IsOptional()
  @IsEnum(OrderPriorityEnum)
  priority?: OrderPriorityEnum;

  @IsOptional()
  @IsEnum(OrderStationEnum)
  station?: OrderStationEnum;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsDateString()
  estimatedReadyAt?: string | null;

  @IsOptional()
  @IsDateString()
  deliveredAt?: string | null;

  @IsOptional()
  @IsBoolean()
  state?: boolean;
}
