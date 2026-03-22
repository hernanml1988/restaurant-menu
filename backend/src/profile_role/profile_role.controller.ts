import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfileRoleService } from './profile_role.service';
import { CreateProfileRoleDto } from './dto/create-profile_role.dto';
import { UpdateProfileRoleDto } from './dto/update-profile_role.dto';

@Controller('profile-role')
export class ProfileRoleController {
  constructor(private readonly profileRoleService: ProfileRoleService) {}

  @Post()
  create(@Body() createProfileRoleDto: CreateProfileRoleDto) {
    return this.profileRoleService.create(createProfileRoleDto);
  }

  @Get()
  findAll() {
    return this.profileRoleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileRoleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileRoleDto: UpdateProfileRoleDto) {
    return this.profileRoleService.update(+id, updateProfileRoleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileRoleService.remove(+id);
  }
}
