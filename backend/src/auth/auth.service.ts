import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt'; // Asegúrate de que la ruta sea correcta
  import { Response } from 'express'; // Importa Response
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import Utils from '../utils/errorUtils';
  // import { StatusEnum } from 'src/enums/status.enum';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { StatusEnum } from '../enums/status.enum';
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly userService: UserService,
      private readonly jwtService: JwtService,
  
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    ) {}

    async validateUser(email: string, password: string): Promise<any> {
      const user = await this.userService.findByEmail(email); // Busca al usuario por su email
      if (user && (await bcrypt.compare(password, user.password))) {
        // Si la contraseña es correcta, retorna el usuario (omitimos la contraseña)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
      throw new UnauthorizedException('Credenciales incorrectas');
    }
  
    async login(user: any, res: Response) {
      if (user. status !== StatusEnum.ACTIVE) {
        return res.status(403).send({
          message: ' no se puede iniciar sesión.',
        });
      }
    
      const payload = { email: user.email, sub: user.id };
      
      const token = this.jwtService.sign(payload, { expiresIn: '1h' });
    
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
      res.cookie('jwt', token, {
        httpOnly: true,
        sameSite :'strict',
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 3600000, 
      });
      
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 604800000, // 7 días
      });
    
      res.send({ message: 'Login exitoso', data: user });
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
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hora
  
        user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
        user.tkresetpassExpires = resetTokenExpires;
  
        await this.userRepository.save(user);
        // try {
        //   const mail = await this.mailService.sendPasswordResetEmail(
        //     user.name + ' ' + user.lastname,
        //     user.email,
        //     resetToken,
        //   );
        // } catch (error) {
        //   throw new BadRequestException('No se ha podido enviar el correo')
        // }
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
          throw new BadRequestException('Token inválido o expirado');
        }
  
        const isValidToken = await bcrypt.compare(
          resetToken,
          user.resetPasswordToken,
        );
        if (!isValidToken) {
          throw new BadRequestException('Token inválido');
        }
  
        user.password = await bcrypt.hash(newPassword, 10) ;
        user.resetPasswordToken = null;
        user.tkresetpassExpires = null;
        await this.userRepository.save(user);
      } catch (error) {
        throw new BadRequestException('Error al restablecer la contraseña');
      }
    }
  
    async verifyToken(token: string): Promise<boolean> {
      try {
        const decoded = this.jwtService.verify(token);
  
        // Verifica si el token no ha expirado
        if (decoded) {
          return true;
        } else {
          return false;
        }
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
  