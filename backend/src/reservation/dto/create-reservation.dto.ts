import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ReservationStatusEnum } from '../entities/reservation.entity';

export class CreateReservationDto {
  @IsString()
  guestName: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsInt()
  @Min(1)
  partySize: number;

  @IsDateString()
  reservationAt: string;

  @IsOptional()
  @IsEnum(ReservationStatusEnum)
  reservationStatus?: ReservationStatusEnum;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  tableId?: string;
}
