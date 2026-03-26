import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartDiningSessionDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  existingSessionToken?: string;
}
