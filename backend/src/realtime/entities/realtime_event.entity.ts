import {
  BeforeInsert,
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('realtime_events')
export class RealtimeEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  scope: 'internal' | 'session';

  @Column()
  event: string;

  @Column({ nullable: true, default: null })
  sessionToken: string | null;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column()
  createdAt: Date;

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = new Date();
  }
}
