import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
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

  @IsOptional()
  @IsString()
  discountType?: 'percentage' | 'fixed' | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsString()
  discountReason?: string | null;
}
