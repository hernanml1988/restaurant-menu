import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';
import Utils from '../utils/errorUtils';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfileRole)
    private readonly profileRoleRepository: Repository<ProfileRole>,
  ) { }

  async initService() {

    try {
      const data = {
        user: {
          username: "hmiranda@thimkti.cl",
          password: "thinkti080"
        },
        profile: {
          name: "admin",
          lastname: "admi",
          secondLastname: "admin"
        },
        role: {
          name: "Super-Administrador",
          description: "Puede realizar cualquier acción"
        }
      }

      const user = new User()
      user.username = data.user.username
      user.password = data.user.password

      const newUser = await this.userRepository.save(user)

      const profile = new Profile()
      profile.name = data.profile.name
      profile.lastname = data.profile.lastname
      profile.secondLastname = data.profile.secondLastname
      profile.user = newUser

      const newProfile = await this.profileRepository.save(profile)

      const role = new Role()
      role.name = data.role.name
      role.description = data.role.description

      const newRole = await this.roleRepository.save(role)

      const profileRole= new ProfileRole()
      profileRole.role = newRole
      profileRole.profile = newProfile

      const newProfileRole = await this.profileRoleRepository.save(profileRole)


      return {
        message: "Carga inicial realizada exitosamente",
        user: newUser,
        profile: newProfile,
        role: newRole
      }

    } catch (error) {
      Utils.errorResponse(error)
    }


  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { username: email }
    });
  }
}
