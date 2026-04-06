import { IsOptional, IsString } from 'class-validator';

export class ReopenDiningSessionDto {
  @IsOptional()
  @IsString()
  reopenedBy?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
