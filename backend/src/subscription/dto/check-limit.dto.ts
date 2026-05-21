import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export enum LimitKindEnum {
  STAFF = 'staff',
  PRODUCTS = 'products',
  PRODUCTS_WITH_IMAGE = 'products_with_image',
  TABLES = 'tables',
}

export class CheckLimitDto {
  @IsUUID()
  restaurantId: string;

  @IsEnum(LimitKindEnum)
  kind: LimitKindEnum;

  @IsString()
  @IsNotEmpty()
  operation: string;
}
