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
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Table } from '../../table/entities/table.entity';
import { OrderItem } from './order_item.entity';

export enum OrderStatusEnum {
  RECEIVED = 'received',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
}

export enum OrderPriorityEnum {
  NORMAL = 'normal',
  HIGH = 'high',
}

export enum OrderStationEnum {
  COCINA = 'cocina',
  BAR = 'bar',
  POSTRES = 'postres',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  number: number;

  @Column({
    type: 'enum',
    enum: OrderStatusEnum,
    default: OrderStatusEnum.RECEIVED,
  })
  orderStatus: OrderStatusEnum;

  @Column({
    type: 'enum',
    enum: OrderPriorityEnum,
    default: OrderPriorityEnum.NORMAL,
  })
  priority: OrderPriorityEnum;

  @Column({
    type: 'enum',
    enum: OrderStationEnum,
    default: OrderStationEnum.COCINA,
  })
  station: OrderStationEnum;

  @Column({ type: 'text', nullable: true, default: null })
  observations: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true, default: null })
  orderedAtLabel: string;

  @Column({ nullable: true, default: null })
  estimatedReadyAt: Date;

  @Column({ nullable: true, default: null })
  deliveredAt: Date;

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

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.orders, {
    nullable: false,
  })
  restaurant: Restaurant;

  @ManyToOne(() => Table, (table) => table.orders, {
    nullable: false,
  })
  table: Table;

  @ManyToOne(() => DiningSession, (diningSession) => diningSession.orders, {
    nullable: true,
  })
  diningSession: DiningSession;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[];

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
