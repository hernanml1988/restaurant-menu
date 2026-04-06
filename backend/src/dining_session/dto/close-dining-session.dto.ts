import { IsOptional, IsString } from 'class-validator';

export class CloseDiningSessionDto {
  @IsOptional()
  @IsString()
  closedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
