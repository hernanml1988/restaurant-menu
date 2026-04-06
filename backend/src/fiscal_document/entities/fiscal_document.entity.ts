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
import { Receipt } from '../../receipt/entities/receipt.entity';

export enum FiscalDocumentTypeEnum {
  RECEIPT = 'receipt',
  INVOICE = 'invoice',
}

export enum FiscalDocumentStatusEnum {
  ISSUED = 'issued',
  CANCELLED = 'cancelled',
}

@Entity('fiscal_documents')
export class FiscalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  folio: string;

  @Column({
    type: 'enum',
    enum: FiscalDocumentTypeEnum,
  })
  documentType: FiscalDocumentTypeEnum;

  @Column({
    type: 'enum',
    enum: FiscalDocumentStatusEnum,
    default: FiscalDocumentStatusEnum.ISSUED,
  })
  documentStatus: FiscalDocumentStatusEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'jsonb' })
  payloadSnapshot: Record<string, unknown>;

  @Column()
  issuedBy: string;

  @Column()
  createdAt: Date;

  @ManyToOne(() => Restaurant, { nullable: false })
  restaurant: Restaurant;

  @ManyToOne(() => DiningSession, { nullable: false })
  diningSession: DiningSession;

  @ManyToOne(() => Payment, {
    nullable: true,
  })
  payment: Payment | null;

  @ManyToOne(() => Receipt, {
    nullable: true,
  })
  receipt: Receipt | null;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
