import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    initService: jest.Mock;
    createPublic: jest.Mock;
  };
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowBootstrap = process.env.ALLOW_PUBLIC_BOOTSTRAP;

  beforeEach(async () => {
    userService = {
      initService: jest.fn().mockReturnValue({ message: 'ok-init' }),
      createPublic: jest.fn().mockReturnValue({ message: 'ok-public-create' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalAllowBootstrap === undefined) {
      delete process.env.ALLOW_PUBLIC_BOOTSTRAP;
    } else {
      process.env.ALLOW_PUBLIC_BOOTSTRAP = originalAllowBootstrap;
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('allows bootstrap endpoints in development by default', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOW_PUBLIC_BOOTSTRAP;

    controller.initService();

    expect(userService.initService).toHaveBeenCalledTimes(1);
  });

  it('blocks bootstrap endpoints in production by default', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_PUBLIC_BOOTSTRAP;

    expect(() =>
      controller.createPublic({
        username: 'qa@mesa.dev',
        password: 'qa123456',
        name: 'QA',
        lastname: 'User',
      } as any),
    ).toThrow(ForbiddenException);

    expect(userService.createPublic).not.toHaveBeenCalled();
  });

  it('allows bootstrap endpoints in production only with explicit flag', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_PUBLIC_BOOTSTRAP = 'true';

    controller.createPublic({
      username: 'qa@mesa.dev',
      password: 'qa123456',
      name: 'QA',
      lastname: 'User',
    } as any);

    expect(userService.createPublic).toHaveBeenCalledTimes(1);
  });
});
