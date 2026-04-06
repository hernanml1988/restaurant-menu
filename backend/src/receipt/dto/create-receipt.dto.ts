import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReceiptTypeEnum } from '../entities/receipt.entity';

export class CreateReceiptDto {
  @IsString()
  sessionToken: string;

  @IsEnum(ReceiptTypeEnum)
  type: ReceiptTypeEnum;

  @IsOptional()
  @IsUUID()
  paymentId?: string;
}
