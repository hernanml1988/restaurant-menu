import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CloseDiningSessionDto } from './dto/close-dining-session.dto';
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

  @Patch('public/:sessionToken/close')
  close(
    @Param('sessionToken') sessionToken: string,
    @Body() closeDiningSessionDto: CloseDiningSessionDto,
  ) {
    return this.diningSessionService.close(
      sessionToken,
      closeDiningSessionDto,
    );
  }
}
