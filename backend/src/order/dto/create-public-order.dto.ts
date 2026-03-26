import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  OrderPriorityEnum,
  OrderStationEnum,
} from '../entities/order.entity';

class CreatePublicOrderExtraDto {
  @IsUUID()
  productExtraId: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

class CreatePublicOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePublicOrderExtraDto)
  extras?: CreatePublicOrderExtraDto[];
}

export class CreatePublicOrderDto {
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @IsOptional()
  @IsEnum(OrderPriorityEnum)
  priority?: OrderPriorityEnum;

  @IsOptional()
  @IsEnum(OrderStationEnum)
  station?: OrderStationEnum;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePublicOrderItemDto)
  items: CreatePublicOrderItemDto[];
}

export {
  CreatePublicOrderExtraDto,
  CreatePublicOrderItemDto,
};
