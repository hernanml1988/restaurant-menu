import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { Plan } from './plan.entity';

export enum SubscriptionStatusEnum {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

@Entity('restaurant_subscriptions')
export class RestaurantSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Restaurant,
    (restaurant) => restaurant.subscriptions,
    { nullable: false },
  )
  restaurant: Restaurant;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions, { nullable: false })
  plan: Plan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusEnum,
    default: SubscriptionStatusEnum.ACTIVE,
  })
  status: SubscriptionStatusEnum;

  @Column({ type: 'timestamp', nullable: true, default: null })
  startedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  endsAt: Date | null;

  @Column({ default: true })
  state: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

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
