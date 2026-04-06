import { Controller, Param, Req, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RealtimeService } from './realtime.service';

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Sse('internal')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin', 'kitchen')
  streamInternal(@Req() req: Request) {
    return this.realtimeService.streamInternal(
      Number(req.headers['last-event-id'] ?? 0),
    );
  }

  @Sse('public/session/:sessionToken')
  streamSession(@Param('sessionToken') sessionToken: string, @Req() req: Request) {
    return this.realtimeService.streamSession(
      sessionToken,
      Number(req.headers['last-event-id'] ?? 0),
    );
  }
}
