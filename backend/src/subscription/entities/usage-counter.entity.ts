import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';

@Entity('usage_counters')
export class UsageCounter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Restaurant, { nullable: false })
  restaurant: Restaurant;

  @Column()
  metric: string;

  @Column({ type: 'int', default: 0 })
  value: number;

  @Column({ type: 'date' })
  periodStart: string;

  @Column({ type: 'date' })
  periodEnd: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

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
