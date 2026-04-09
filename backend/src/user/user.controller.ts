import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InternalRoles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  private isPublicBootstrapEnabled() {
    const explicitFlag = process.env.ALLOW_PUBLIC_BOOTSTRAP;
    if (explicitFlag !== undefined) {
      return explicitFlag === 'true';
    }

    const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
    return nodeEnv === 'development' || nodeEnv === 'test';
  }

  private assertPublicBootstrapEnabled() {
    if (this.isPublicBootstrapEnabled()) {
      return;
    }

    throw new ForbiddenException(
      'Public bootstrap endpoints are disabled in this environment.',
    );
  }

  @Post('init-data')
  initService() {
    this.assertPublicBootstrapEnabled();
    return this.userService.initService();
  }

  @Post('public-create')
  createPublic(@Body() createUserDto: CreateUserDto) {
    this.assertPublicBootstrapEnabled();
    return this.userService.createPublic(createUserDto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @InternalRoles('admin')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
