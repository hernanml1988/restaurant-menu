import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { StatusEnum } from '../enums/status.enum';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRole } from '../profile_role/entities/profile_role.entity';
import { Role } from '../role/entities/role.entity';
import Utils from '../utils/errorUtils';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

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
  ) {}

  private sanitizeUser(user: User) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      state: user.state,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile
        ? {
            id: user.profile.id,
            name: user.profile.name,
            lastname: user.profile.lastname,
            secondLastname: user.profile.secondLastname,
          }
        : null,
      roles:
        user.profile?.profileRoles?.map((profileRole) => profileRole.role?.name) ??
        [],
    };
  }

  private async findRoleOrFail(roleId: string) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async initService() {
    try {
      const data = {
        user: {
          username: 'hmiranda@thimkti.cl',
          password: 'thinkti080',
        },
        profile: {
          name: 'admin',
          lastname: 'admi',
          secondLastname: 'admin',
        },
        role: {
          name: 'Super-Administrador',
          description: 'Puede realizar cualquier accion',
        },
      };

      const user = new User();
      user.username = data.user.username;
      user.password = data.user.password;

      const newUser = await this.userRepository.save(user);

      const profile = new Profile();
      profile.name = data.profile.name;
      profile.lastname = data.profile.lastname;
      profile.secondLastname = data.profile.secondLastname;
      profile.user = newUser;

      const newProfile = await this.profileRepository.save(profile);

      const role = new Role();
      role.name = data.role.name;
      role.description = data.role.description;

      const newRole = await this.roleRepository.save(role);

      const profileRole = new ProfileRole();
      profileRole.role = newRole;
      profileRole.profile = newProfile;

      await this.profileRoleRepository.save(profileRole);

      return {
        message: 'Carga inicial realizada exitosamente',
        user: newUser,
        profile: newProfile,
        role: newRole,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async create(createUserDto: CreateUserDto) {
    return this.createInternal(createUserDto);
  }

  async createPublic(createUserDto: CreateUserDto) {
    return this.createInternal(createUserDto);
  }

  private async createInternal(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }

      const role = createUserDto.roleId
        ? await this.findRoleOrFail(createUserDto.roleId)
        : null;

      const user = new User();
      user.username = createUserDto.username;
      user.password = createUserDto.password;
      user.state = createUserDto.state ?? true;

      const newUser = await this.userRepository.save(user);

      const profile = new Profile();
      profile.name = createUserDto.name;
      profile.lastname = createUserDto.lastname;
      profile.secondLastname = createUserDto.secondLastname ?? '';
      profile.user = newUser;

      const newProfile = await this.profileRepository.save(profile);

      if (role) {
        const profileRole = new ProfileRole();
        profileRole.profile = newProfile;
        profileRole.role = role;

        await this.profileRoleRepository.save(profileRole);
      }

      const createdUser = await this.userRepository.findOne({
        where: { id: newUser.id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      return {
        message: 'Usuario creado exitosamente',
        data: this.sanitizeUser(createdUser),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const users = await this.userRepository.find({
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        message: 'Usuarios obtenidos exitosamente',
        data: users.map((user) => this.sanitizeUser(user)),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        message: 'Usuario obtenido exitosamente',
        data: this.sanitizeUser(user),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (updateUserDto.username && updateUserDto.username !== user.username) {
        const existingUser = await this.userRepository.findOne({
          where: { username: updateUserDto.username },
        });

        if (existingUser && existingUser.id !== user.id) {
          throw new ConflictException('Username already exists');
        }

        user.username = updateUserDto.username;
      }

      if (updateUserDto.password) {
        user.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      if (typeof updateUserDto.state === 'boolean') {
        user.state = updateUserDto.state;
      }

      await this.userRepository.save(user);

      if (user.profile) {
        user.profile.name = updateUserDto.name ?? user.profile.name;
        user.profile.lastname = updateUserDto.lastname ?? user.profile.lastname;
        user.profile.secondLastname =
          updateUserDto.secondLastname ?? user.profile.secondLastname;

        await this.profileRepository.save(user.profile);
      }

      if (updateUserDto.roleId) {
        const role = await this.findRoleOrFail(updateUserDto.roleId);
        const currentProfileRole = user.profile?.profileRoles?.[0] ?? null;

        if (currentProfileRole) {
          currentProfileRole.role = role;
          await this.profileRoleRepository.save(currentProfileRole);
        } else if (user.profile) {
          const profileRole = new ProfileRole();
          profileRole.profile = user.profile;
          profileRole.role = role;
          await this.profileRoleRepository.save(profileRole);
        }
      }

      const updatedUser = await this.userRepository.findOne({
        where: { id: user.id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      return {
        message: 'Usuario actualizado exitosamente',
        data: this.sanitizeUser(updatedUser),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        relations: {
          profile: {
            profileRoles: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.state = false;
      user.status = StatusEnum.INACTIVE;

      const removedUser = await this.userRepository.save(user);

      return {
        message: 'Usuario desactivado exitosamente',
        data: this.sanitizeUser(removedUser),
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { username: email },
      relations: {
        profile: {
          profileRoles: {
            role: true,
          },
        },
      },
    });
  }
}
