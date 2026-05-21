import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { User } from '../../user/entities/user.entity';

export enum RestaurantStaffRoleEnum {
  OWNER = 'owner',
  ADMIN = 'admin',
  KITCHEN = 'kitchen',
}

@Entity('restaurant_staff')
export class RestaurantStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.staffMemberships, {
    nullable: false,
  })
  restaurant: Restaurant;

  @ManyToOne(() => User, (user) => user.restaurantMemberships, { nullable: false })
  user: User;

  @Column({
    type: 'enum',
    enum: RestaurantStaffRoleEnum,
    default: RestaurantStaffRoleEnum.ADMIN,
  })
  staffRole: RestaurantStaffRoleEnum;

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
  }

  @BeforeUpdate()
  generateUpdateAt() {
    this.updatedAt = new Date();
  }
}
