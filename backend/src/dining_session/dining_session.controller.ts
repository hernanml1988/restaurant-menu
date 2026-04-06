import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CloseDiningSessionDto } from './dto/close-dining-session.dto';
import { ReopenDiningSessionDto } from './dto/reopen-dining-session.dto';
import { StartDiningSessionDto } from './dto/start-dining-session.dto';
import { DiningSessionService } from './dining_session.service';

@Controller('dining-session')
export class DiningSessionController {
  constructor(
    private readonly diningSessionService: DiningSessionService,
  ) {}

  @Post('public/start')
  start(@Body() startDiningSessionDto: StartDiningSessionDto) {
    return this.diningSessionService.start(startDiningSessionDto);
  }

  @Get('public/:sessionToken')
  findActiveByToken(@Param('sessionToken') sessionToken: string) {
    return this.diningSessionService.findActiveByToken(sessionToken);
  }

  @Get(':sessionToken/account')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  findAccountInternal(@Param('sessionToken') sessionToken: string) {
    return this.diningSessionService.findAccountInternal(sessionToken);
  }

  @Patch(':sessionToken/payment-pending')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  markPaymentPending(@Param('sessionToken') sessionToken: string, @Req() req: Request) {
    return this.diningSessionService.markPaymentPending(
      sessionToken,
      (req.user as any)?.username || (req.user as any)?.userId || 'system01',
    );
  }

  @Patch(':sessionToken/close')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  closeInternal(
    @Param('sessionToken') sessionToken: string,
    @Body() closeDiningSessionDto: CloseDiningSessionDto,
    @Req() req: Request,
  ) {
    return this.diningSessionService.close(
      sessionToken,
      closeDiningSessionDto,
      (req.user as any)?.username || (req.user as any)?.userId || 'system01',
    );
  }

  @Patch(':sessionToken/reopen')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  reopen(
    @Param('sessionToken') sessionToken: string,
    @Body() reopenDiningSessionDto: ReopenDiningSessionDto,
    @Req() req: Request,
  ) {
    return this.diningSessionService.reopen(
      sessionToken,
      reopenDiningSessionDto,
      (req.user as any)?.username || (req.user as any)?.userId || 'system01',
    );
  }

  @Patch('public/:sessionToken/close')
  close(
    @Param('sessionToken') sessionToken: string,
    @Body() closeDiningSessionDto: CloseDiningSessionDto,
  ) {
    return this.diningSessionService.close(
      sessionToken,
      closeDiningSessionDto,
      closeDiningSessionDto?.closedBy?.trim() || 'system01',
    );
  }
}
