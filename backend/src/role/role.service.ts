import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusEnum } from '../enums/status.enum';
import Utils from '../utils/errorUtils';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      const existingByName = await this.roleRepository.findOne({
        where: { name: createRoleDto.name },
      });

      if (existingByName) {
        throw new ConflictException('Role name already exists');
      }

      const existingByDescription = await this.roleRepository.findOne({
        where: { description: createRoleDto.description },
      });

      if (existingByDescription) {
        throw new ConflictException('Role description already exists');
      }

      const role = this.roleRepository.create({
        name: createRoleDto.name,
        description: createRoleDto.description,
        state: createRoleDto.state ?? true,
      });

      const newRole = await this.roleRepository.save(role);

      return {
        message: 'Rol creado exitosamente',
        data: newRole,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findAll() {
    try {
      const roles = await this.roleRepository.find({
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        message: 'Roles obtenidos exitosamente',
        data: roles,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async findOne(id: string) {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      return {
        message: 'Rol obtenido exitosamente',
        data: role,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      if (updateRoleDto.name && updateRoleDto.name !== role.name) {
        const existingByName = await this.roleRepository.findOne({
          where: { name: updateRoleDto.name },
        });

        if (existingByName && existingByName.id !== role.id) {
          throw new ConflictException('Role name already exists');
        }
      }

      if (
        updateRoleDto.description &&
        updateRoleDto.description !== role.description
      ) {
        const existingByDescription = await this.roleRepository.findOne({
          where: { description: updateRoleDto.description },
        });

        if (existingByDescription && existingByDescription.id !== role.id) {
          throw new ConflictException('Role description already exists');
        }
      }

      Object.assign(role, {
        name: updateRoleDto.name ?? role.name,
        description: updateRoleDto.description ?? role.description,
        state: updateRoleDto.state ?? role.state,
      });

      const updatedRole = await this.roleRepository.save(role);

      return {
        message: 'Rol actualizado exitosamente',
        data: updatedRole,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async remove(id: string) {
    try {
      const role = await this.roleRepository.findOne({
        where: { id },
      });

      if (!role) {
        throw new NotFoundException('Role not found');
      }

      role.state = false;
      role.status = StatusEnum.INACTIVE;

      const removedRole = await this.roleRepository.save(role);

      return {
        message: 'Rol desactivado exitosamente',
        data: removedRole,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }
}
