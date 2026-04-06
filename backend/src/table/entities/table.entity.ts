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
import { DiningSession } from '../../dining_session/entities/dining_session.entity';
import { Order } from '../../order/entities/order.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { ServiceRequest } from '../../service_request/entities/service_request.entity';

export enum TableStatusEnum {
  FREE = 'free',
  OCCUPIED = 'occupied',
  WITH_ORDER = 'with-order',
  PENDING_PAYMENT = 'pending-payment',
}

@Entity('restaurant_tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  number: number;

  @Column()
  name: string;

  @Column()
  capacity: number;

  @Column()
  zone: string;

  @Column({ unique: true })
  qrCode: string;

  @Column({
    type: 'enum',
    enum: TableStatusEnum,
    default: TableStatusEnum.FREE,
  })
  serviceStatus: TableStatusEnum;

  @Column({ default: 0 })
  activeOrders: number;

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

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.tables, {
    nullable: false,
  })
  restaurant: Restaurant;

  @OneToMany(() => DiningSession, (diningSession) => diningSession.table)
  diningSessions: DiningSession[];

  @OneToMany(() => Order, (order) => order.table)
  orders: Order[];

  @OneToMany(() => Payment, (payment) => payment.table)
  payments: Payment[];

  @OneToMany(() => ServiceRequest, (serviceRequest) => serviceRequest.table)
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
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  generateUpdateAt() {
    this.updatedAt = new Date();
  }
}
