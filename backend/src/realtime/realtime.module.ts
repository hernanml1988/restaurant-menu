import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtimeController } from './realtime.controller';
import { RealtimeEvent } from './entities/realtime_event.entity';
import { RealtimeService } from './realtime.service';

@Module({
  imports: [TypeOrmModule.forFeature([RealtimeEvent])],
  controllers: [RealtimeController],
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
