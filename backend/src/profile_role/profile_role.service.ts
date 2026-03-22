import { Injectable } from '@nestjs/common';
import { CreateProfileRoleDto } from './dto/create-profile_role.dto';
import { UpdateProfileRoleDto } from './dto/update-profile_role.dto';

@Injectable()
export class ProfileRoleService {
  create(createProfileRoleDto: CreateProfileRoleDto) {
    return 'This action adds a new profileRole';
  }

  findAll() {
    return `This action returns all profileRole`;
  }

  findOne(id: number) {
    return `This action returns a #${id} profileRole`;
  }

  update(id: number, updateProfileRoleDto: UpdateProfileRoleDto) {
    return `This action updates a #${id} profileRole`;
  }

  remove(id: number) {
    return `This action removes a #${id} profileRole`;
  }
}
