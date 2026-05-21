import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../../enums/status.enum';
import { RestaurantSubscription } from './restaurant-subscription.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true, default: null })
  description: string;

  @Column({ default: false })
  includeKitchen: boolean;

  @Column({ default: false })
  includeQr: boolean;

  @Column({ type: 'int', default: 0 })
  maxStaff: number;

  @Column({ type: 'int', default: 0 })
  maxProducts: number;

  @Column({ type: 'int', default: 0 })
  maxProductsWithImage: number;

  @Column({ type: 'int', default: 0 })
  maxTables: number;

  @Column({ type: 'int', nullable: true, default: null })
  softMaxProducts: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  softMaxTables: number | null;

  @Column({ default: true })
  state: boolean;

  @Column({ default: StatusEnum.ACTIVE })
  status: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @OneToMany(() => RestaurantSubscription, (subscription) => subscription.plan)
  subscriptions: RestaurantSubscription[];

  @BeforeInsert()
  generateDates() {
    const now = new Date();
    this.createdAt = now;
    this.updatedAt = now;
  }

  @BeforeUpdate()
  generateUpdateAt() {
    this.updatedAt = new Date();
  }
}
