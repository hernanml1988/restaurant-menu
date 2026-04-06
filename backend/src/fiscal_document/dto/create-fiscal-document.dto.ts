import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { FiscalDocumentTypeEnum } from '../entities/fiscal_document.entity';

export class CreateFiscalDocumentDto {
  @IsString()
  sessionToken: string;

  @IsEnum(FiscalDocumentTypeEnum)
  documentType: FiscalDocumentTypeEnum;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsUUID()
  receiptId?: string;
}
