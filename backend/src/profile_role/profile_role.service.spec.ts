import { Test, TestingModule } from '@nestjs/testing';
import { ProfileRoleService } from './profile_role.service';

describe('ProfileRoleService', () => {
  let service: ProfileRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfileRoleService],
    }).compile();

    service = module.get<ProfileRoleService>(ProfileRoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
