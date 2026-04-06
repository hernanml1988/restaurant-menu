import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('order_sequences')
export class OrderSequence {
  @PrimaryColumn()
  scope: string;

  @Column({ default: 0 })
  lastNumber: number;
}
