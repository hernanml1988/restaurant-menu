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

export enum CashSessionStatusEnum {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('cash_sessions')
export class CashSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CashSessionStatusEnum,
    default: CashSessionStatusEnum.OPEN,
  })
  sessionStatus: CashSessionStatusEnum;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  openingAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  expectedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  closingAmount: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: null })
  differenceAmount: number | null;

  @Column({ type: 'text', nullable: true, default: null })
  notes: string | null;

  @Column()
  openedAt: Date;

  @Column({ nullable: true, default: null })
  closedAt: Date | null;

  @Column()
  openedBy: string;

  @Column({ nullable: true, default: null })
  closedBy: string | null;

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

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.id, {
    nullable: false,
  })
  restaurant: Restaurant;

  @BeforeInsert()
  beforeInsert() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
    this.openedAt = this.openedAt ?? now;
    this.createdBy = this.createdBy ?? this.openedBy ?? 'system01';
    this.modifiedBy = this.modifiedBy ?? this.openedBy ?? 'system01';
  }

  @BeforeUpdate()
  beforeUpdate() {
    this.updatedAt = new Date();
  }
}
