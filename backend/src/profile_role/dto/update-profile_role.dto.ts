import { PartialType } from '@nestjs/mapped-types';
import { CreateProfileRoleDto } from './create-profile_role.dto';

export class UpdateProfileRoleDto extends PartialType(CreateProfileRoleDto) {}
