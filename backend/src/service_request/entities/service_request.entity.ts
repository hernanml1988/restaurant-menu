import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../../enums/status.enum';
import { DiningSession } from '../../dining_session/entities/dining_session.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Table } from '../../table/entities/table.entity';

export enum ServiceRequestTypeEnum {
  WAITER = 'waiter',
  BILL = 'bill',
  HELP = 'help',
}

export enum ServiceRequestStatusEnum {
  PENDING = 'pending',
  ATTENDED = 'attended',
  CANCELLED = 'cancelled',
}

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ServiceRequestTypeEnum,
    default: ServiceRequestTypeEnum.WAITER,
  })
  type: ServiceRequestTypeEnum;

  @Column({
    type: 'enum',
    enum: ServiceRequestStatusEnum,
    default: ServiceRequestStatusEnum.PENDING,
  })
  requestStatus: ServiceRequestStatusEnum;

  @Column({ type: 'text', nullable: true, default: null })
  notes: string;

  @Column({ nullable: true, default: null })
  attendedAt: Date;

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

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.serviceRequests, {
    nullable: false,
  })
  restaurant: Restaurant;

  @ManyToOne(() => Table, (table) => table.serviceRequests, {
    nullable: false,
  })
  table: Table;

  @ManyToOne(
    () => DiningSession,
    (diningSession) => diningSession.serviceRequests,
    {
      nullable: true,
    },
  )
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
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  generateUpdateAt() {
    this.updatedAt = new Date();
  }
}
