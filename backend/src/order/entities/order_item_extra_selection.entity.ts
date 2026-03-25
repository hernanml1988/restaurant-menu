import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../../enums/status.enum';
import { ProductExtra } from '../../product_extra/entities/product_extra.entity';
import { OrderItem } from './order_item.entity';

@Entity('order_item_extra_selections')
export class OrderItemExtraSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceImpact: number;

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

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.selectedExtras, {
    nullable: false,
  })
  orderItem: OrderItem;

  @ManyToOne(
    () => ProductExtra,
    (productExtra) => productExtra.orderItemExtraSelections,
    {
      nullable: false,
    },
  )
  productExtra: ProductExtra;

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
