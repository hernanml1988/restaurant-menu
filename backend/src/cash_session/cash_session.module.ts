import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogModule } from '../audit_log/audit_log.module';
import { Payment } from '../payment/entities/payment.entity';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { CashSessionController } from './cash_session.controller';
import { CashSessionService } from './cash_session.service';
import { CashSession } from './entities/cash_session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CashSession, Payment]),
    RestaurantModule,
    AuditLogModule,
  ],
  controllers: [CashSessionController],
  providers: [CashSessionService],
  exports: [CashSessionService, TypeOrmModule],
})
export class CashSessionModule {}
