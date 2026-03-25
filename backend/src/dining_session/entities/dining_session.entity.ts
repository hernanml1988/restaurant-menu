import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../../enums/status.enum';
import { Order } from '../../order/entities/order.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { ServiceRequest } from '../../service_request/entities/service_request.entity';
import { Table } from '../../table/entities/table.entity';

@Entity('dining_sessions')
export class DiningSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionToken: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true, default: null })
  startedAt: Date;

  @Column({ nullable: true, default: null })
  closedAt: Date;

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

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.diningSessions, {
    nullable: false,
  })
  restaurant: Restaurant;

  @ManyToOne(() => Table, (table) => table.diningSessions, {
    nullable: false,
  })
  table: Table;

  @OneToMany(() => Order, (order) => order.diningSession)
  orders: Order[];

  @OneToMany(
    () => ServiceRequest,
    (serviceRequest) => serviceRequest.diningSession,
  )
  serviceRequests: ServiceRequest[];

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
    if (!this.startedAt) {
      this.startedAt = now;
    }
  }

  @BeforeUpdate()
  generateUpdateAt() {
    this.updatedAt = new Date();
  }
}
