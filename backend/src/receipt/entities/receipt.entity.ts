import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DiningSession } from '../../dining_session/entities/dining_session.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Table } from '../../table/entities/table.entity';

export enum ReceiptTypeEnum {
  PREBILL = 'prebill',
  PAYMENT = 'payment',
}

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: ReceiptTypeEnum,
  })
  type: ReceiptTypeEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ type: 'text' })
  printableHtml: string;

  @Column()
  issuedBy: string;

  @Column()
  createdAt: Date;

  @ManyToOne(() => Restaurant, { nullable: false })
  restaurant: Restaurant;

  @ManyToOne(() => Table, { nullable: false })
  table: Table;

  @ManyToOne(() => DiningSession, { nullable: false })
  diningSession: DiningSession;

  @ManyToOne(() => Payment, {
    nullable: true,
  })
  payment: Payment | null;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
