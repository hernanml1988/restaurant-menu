import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportRangeQueryDto } from './dto/report-range-query.dto';
import { TopProductsQueryDto } from './dto/top-products-query.dto';
import { ReportService } from './report.service';

@Controller('report')
@UseGuards(AuthGuard('jwt'))
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('sales-by-day')
  getSalesByDay(@Query() query: ReportRangeQueryDto) {
    return this.reportService.getSalesByDay(query);
  }

  @Get('prep-times')
  getPrepTimes(@Query() query: ReportRangeQueryDto) {
    return this.reportService.getPrepTimes(query);
  }

  @Get('top-products')
  getTopProducts(@Query() query: TopProductsQueryDto) {
    return this.reportService.getTopProducts(query);
  }

  @Get('weekly-summary')
  getWeeklySummary(@Query() query: ReportRangeQueryDto) {
    return this.reportService.getWeeklySummary(query);
  }
}
