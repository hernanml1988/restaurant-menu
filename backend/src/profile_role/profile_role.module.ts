import { Module } from '@nestjs/common';
import { ProfileRoleService } from './profile_role.service';
import { ProfileRoleController } from './profile_role.controller';

@Module({
  controllers: [ProfileRoleController],
  providers: [ProfileRoleService],
})
export class ProfileRoleModule {}
