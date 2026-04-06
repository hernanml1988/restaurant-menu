import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../../enums/status.enum';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Table } from '../../table/entities/table.entity';

export enum ReservationStatusEnum {
  BOOKED = 'booked',
  CONFIRMED = 'confirmed',
  SEATED = 'seated',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show',
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  guestName: string;

  @Column({ nullable: true, default: null })
  guestPhone: string | null;

  @Column({ nullable: true, default: null })
  guestEmail: string | null;

  @Column()
  partySize: number;

  @Column()
  reservationAt: Date;

  @Column({
    type: 'enum',
    enum: ReservationStatusEnum,
    default: ReservationStatusEnum.BOOKED,
  })
  reservationStatus: ReservationStatusEnum;

  @Column({ type: 'text', nullable: true, default: null })
  notes: string | null;

  @Column({ default: true })
  state: boolean;

  @Column({ default: StatusEnum.ACTIVE })
  status: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ nullable: true, default: null })
  deletedAt: Date | null;

  @Column()
  createdBy: string;

  @Column()
  modifiedBy: string;

  @ManyToOne(() => Restaurant, { nullable: false })
  restaurant: Restaurant;

  @ManyToOne(() => Table, {
    nullable: true,
  })
  table: Table | null;

  @BeforeInsert()
  beforeInsert() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    this.createdBy = this.createdBy ?? 'system01';
    this.modifiedBy = this.modifiedBy ?? 'system01';
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }
}
