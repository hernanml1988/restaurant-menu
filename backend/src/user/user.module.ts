import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([User, Role, Profile, ProfileRole]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports:[TypeOrmModule]
})
export class UserModule {}
