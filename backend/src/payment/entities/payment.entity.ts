import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiningSession } from '../../dining_session/entities/dining_session.entity';
import { StatusEnum } from '../../enums/status.enum';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Table } from '../../table/entities/table.entity';

export enum PaymentMethodEnum {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.CASH,
  })
  method: PaymentMethodEnum;

  @Column({
    type: 'enum',
    enum: PaymentStatusEnum,
    default: PaymentStatusEnum.PAID,
  })
  paymentStatus: PaymentStatusEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tipAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  receivedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  changeAmount: number;

  @Column({ nullable: true, default: null })
  payerName: string;

  @Column({ nullable: true, default: null })
  reference: string;

  @Column({ type: 'text', nullable: true, default: null })
  notes: string;

  @Column({ nullable: true, default: null })
  paidAt: Date;

  @Column({ default: true })
  state: boolean;

  @Column({ default: StatusEnum.ACTIVE })
  status: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ nullable: true, default: null })
  deletedAt: Date;

  @Column()
  createdBy: string;

  @Column()
  modifiedBy: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.payments, {
    nullable: false,
  })
  restaurant: Restaurant;

  @ManyToOne(() => Table, (table) => table.payments, {
    nullable: false,
  })
  table: Table;

  @ManyToOne(() => DiningSession, (diningSession) => diningSession.payments, {
    nullable: false,
  })
  diningSession: DiningSession;

  @BeforeInsert()
  createCreatedBy() {
    if (!this.createdBy) {
      this.createdBy = 'system0';
    }
  }

  @BeforeInsert()
  createModifiedBy() {
    if (!this.modifiedBy) {
      this.modifiedBy = 'system01';
    }
  }

  @BeforeInsert()
  generateDates() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    if (!this.paidAt && this.paymentStatus === PaymentStatusEnum.PAID) {
      this.paidAt = now;
    }
  }

  @BeforeUpdate()
  generateUpdateAt() {
    this.updatedAt = new Date();
  }
}
