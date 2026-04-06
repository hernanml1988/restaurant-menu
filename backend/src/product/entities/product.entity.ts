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
import { Category } from '../../category/entities/category.entity';
import { OrderItem } from '../../order/entities/order_item.entity';
import { ProductExtra } from '../../product_extra/entities/product_extra.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true, default: null })
  image: string;

  @Column({ nullable: true, default: null })
  gradient: string;

  @Column({ default: true })
  available: boolean;

  @Column({ default: false })
  popular: boolean;

  @Column({ default: false })
  promo: boolean;

  @Column({ default: false })
  trackStock: boolean;

  @Column({ default: 0 })
  stockQuantity: number;

  @Column({ default: 0 })
  stockAlertThreshold: number;

  @Column('text', { array: true, default: '{}' })
  allergens: string[];

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

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.products, {
    nullable: false,
  })
  restaurant: Restaurant;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: false,
  })
  category: Category;

  @OneToMany(() => ProductExtra, (productExtra) => productExtra.product)
  extras: ProductExtra[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

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
