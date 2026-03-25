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
import { OrderItemExtraSelection } from '../../order/entities/order_item_extra_selection.entity';
import { Product } from '../../product/entities/product.entity';

export enum ProductExtraTypeEnum {
  ADD = 'add',
  REMOVE = 'remove',
  CHOICE = 'choice',
}

@Entity('product_extras')
export class ProductExtra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({
    type: 'enum',
    enum: ProductExtraTypeEnum,
    default: ProductExtraTypeEnum.ADD,
  })
  type: ProductExtraTypeEnum;

  @Column('text', { array: true, default: '{}' })
  options: string[];

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

  @ManyToOne(() => Product, (product) => product.extras, {
    nullable: false,
  })
  product: Product;

  @OneToMany(
    () => OrderItemExtraSelection,
    (orderItemExtraSelection) => orderItemExtraSelection.productExtra,
  )
  orderItemExtraSelections: OrderItemExtraSelection[];

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
