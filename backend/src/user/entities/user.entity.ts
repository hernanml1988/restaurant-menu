import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { StatusEnum } from '../../enums/status.enum';
import { Profile } from '../../profile/entities/profile.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: null })
  password: string;

  @Column({
    unique: true,
    name: 'reset_password_token',
    nullable: true,
  })
  resetPasswordToken: string;

  @Column({ default: null })
  tkresetpassExpires: Date;

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

  //relaciones 

  // Relación uno a uno con Profile
  @OneToOne(() => Profile, (profile) => profile.user) // Bidireccional
  
  profile: Profile;


  //fin relaciones 


  //funciones 

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10); // 10 es el salt rounds
  }

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

  //fin funciones 
}
