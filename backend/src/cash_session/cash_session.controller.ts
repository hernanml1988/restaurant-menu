import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CashSessionService } from './cash_session.service';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';

@Controller('cash-session')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@InternalRoles('admin')
export class CashSessionController {
  constructor(private readonly cashSessionService: CashSessionService) {}

  @Get('current')
  findCurrent() {
    return this.cashSessionService.findCurrent();
  }

  @Get('history')
  findHistory() {
    return this.cashSessionService.findHistory();
  }

  @Post('open')
  open(@Body() openCashSessionDto: OpenCashSessionDto, @Req() req: Request) {
    const actor = (req.user as any)?.username || (req.user as any)?.userId;
    return this.cashSessionService.open(openCashSessionDto, actor);
  }

  @Patch('close')
  close(
    @Body() closeCashSessionDto: CloseCashSessionDto,
    @Req() req: Request,
  ) {
    const actor = (req.user as any)?.username || (req.user as any)?.userId;
    return this.cashSessionService.close(closeCashSessionDto, actor);
  }
}
