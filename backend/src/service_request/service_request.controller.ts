import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreatePublicServiceRequestDto } from './dto/create-public-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { ServiceRequestService } from './service_request.service';

@Controller('service-request')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  findAllInternal() {
    return this.serviceRequestService.findAllInternal();
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  updateInternal(
    @Param('id') id: string,
    @Body() updateServiceRequestDto: UpdateServiceRequestDto,
  ) {
    return this.serviceRequestService.updateInternal(id, updateServiceRequestDto);
  }

  @Post('public')
  createPublic(@Body() createPublicServiceRequestDto: CreatePublicServiceRequestDto) {
    return this.serviceRequestService.createPublic(createPublicServiceRequestDto);
  }
}
