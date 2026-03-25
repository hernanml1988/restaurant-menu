import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Utils from '../utils/errorUtils';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { StatusEnum } from '../enums/status.enum';

type InternalModuleRole = 'admin' | 'kitchen';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private resolveInternalRole(user: any): InternalModuleRole | null {
    const roleNames =
      user?.profile?.profileRoles
        ?.map((profileRole: any) => profileRole?.role?.name)
        .filter(Boolean)
        .map((roleName: string) =>
          roleName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        ) ?? [];

    if (roleNames.some((roleName: string) => roleName.includes('admin'))) {
      return 'admin';
    }

    if (
      roleNames.some(
        (roleName: string) =>
          roleName.includes('cocina') ||
          roleName.includes('kitchen') ||
          roleName.includes('chef'),
      )
    ) {
      return 'kitchen';
    }

    return null;
  }

  private buildAuthUser(user: any) {
    const fullNameParts = [
      user?.profile?.name,
      user?.profile?.lastname,
      user?.profile?.secondLastname,
    ].filter(Boolean);

    return {
      id: user.id,
      email: user.username,
      fullName: fullNameParts.join(' ').trim() || user.username || 'Usuario interno',
      role: this.resolveInternalRole(user),
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Credenciales incorrectas');
  }

  async login(user: any, res: Response) {
    if (user.status !== StatusEnum.ACTIVE) {
      return res.status(403).send({
        message: 'No se puede iniciar sesion.',
      });
    }

    const authUser = this.buildAuthUser(user);

    if (!authUser.role) {
      return res.status(403).send({
        message: 'El usuario no tiene un rol interno compatible.',
      });
    }

    const payload = { email: user.username, sub: user.id };

    const token = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 604800000,
    });

    res.send({ message: 'Login exitoso', data: authUser });
  }

  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const user = await this.userRepository.findOne({ where: { username: email } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const resetToken = this.jwtService.sign(
        { email: user.username },
        { expiresIn: '1h' },
      );
      const resetTokenExpires = new Date(Date.now() + 3600000);

      user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
      user.tkresetpassExpires = resetTokenExpires;

      await this.userRepository.save(user);
      return {
        message: 'User found',
        data: user,
      };
    } catch (error) {
      Utils.errorResponse(error);
    }
  }

  async verifyResetToken(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { username: payload.email },
      });

      if (
        !user ||
        !user.resetPasswordToken ||
        !user.tkresetpassExpires ||
        user.tkresetpassExpires < new Date()
      ) {
        return false;
      }

      const isValidToken = await bcrypt.compare(token, user.resetPasswordToken);
      return isValidToken;
    } catch {
      return false;
    }
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(resetToken);
      const user = await this.userRepository.findOne({
        where: { username: payload.email },
      });

      if (
        !user ||
        !user.resetPasswordToken ||
        !user.tkresetpassExpires ||
        user.tkresetpassExpires < new Date()
      ) {
        throw new BadRequestException('Token invalido o expirado');
      }

      const isValidToken = await bcrypt.compare(
        resetToken,
        user.resetPasswordToken,
      );
      if (!isValidToken) {
        throw new BadRequestException('Token invalido');
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = null;
      user.tkresetpassExpires = null;
      await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException('Error al restablecer la contrasena');
    }
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.verify(token);
      return !!decoded;
    } catch (error) {
      return false;
    }
  }

  async validateUserRegisterLogin(email: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    const { password, ...result } = user;
    return result;

    throw new UnauthorizedException('Credenciales incorrectas');
  }
}
