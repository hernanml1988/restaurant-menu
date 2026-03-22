import {
    Controller,
    Post,
    Body,
    Res,
    Req,
    BadRequestException,
    HttpStatus,
    HttpException,
    Get,
    NotFoundException,
    UnauthorizedException,
  } from '@nestjs/common'; // Asegúrate de que la ruta sea correcta
  import { Response, Request } from 'express';
  import { JwtService } from '@nestjs/jwt';
  import * as jwt from 'jsonwebtoken';
  import Utils from '../utils/errorUtils';
import { AuthService } from './auth.service';
  
  @Controller('auth')
  export class AuthController {
    constructor(
      private readonly authService: AuthService,
      private readonly jwtService: JwtService,
    ) { }
  
    @Post('login')
    async login(@Body() body: any, @Res() res: Response) {
      try {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
          return res.status(401).send({ message: 'Invalid credentials' });
        }
        return this.authService.login(user, res); // Pasa el objeto Response al servicio
      } catch (error) {
        Utils.errorResponse(error);
      }
  
    }
    @Post('refresh')
    async refresh(@Req() req: Request, @Res() res: Response) {
      // Obtén el refresh token desde las cookies
      const refreshToken = req.cookies['refresh_token'];
      // Verifica si el refresh token existe
      if (!refreshToken) {
        throw new HttpException('Refresh token missing', HttpStatus.FORBIDDEN);
      }
  
      try {
        // Verifica el refresh token
        const decoded = this.jwtService.verify(refreshToken);
  
        // Genera un nuevo access token
        const payload = { email: decoded.email, sub: decoded.sub };
        const newAccessToken = this.jwtService.sign(payload, {
          expiresIn: '1h', // Define el tiempo de expiración adecuado
        });
  
        // Establece el nuevo access token en una cookie
        res.cookie('jwt', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3600000, // 1 hora
        });
  
        return res.send({ message: 'Token refreshed successfully' });
      } catch (error) {
        // Si el token es inválido o ha expirado
        if (error instanceof jwt.TokenExpiredError) {
          throw new HttpException(
            'Refresh token expired',
            HttpStatus.UNAUTHORIZED,
          );
        }
        throw new HttpException('Invalid refresh token', HttpStatus.FORBIDDEN);
      }
    }
    @Post('logout')
    logout(@Res() res: Response) {
      // Limpia la cookie 'jwt' estableciéndola con un valor vacío y expiración inmediata
      res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0), // Expira inmediatamente
      });
      res.cookie('refresh_token', '', {
        httpOnly: true,
        expires: new Date(0), // Expira inmediatamente
      });
  
      return res.json({ message: 'Logout successful' });
    }
  
    @Post('request-password-reset')
    async requestPasswordReset(@Body('email') email: string) {
      try {
        const data = await this.authService.requestPasswordReset(email);
        return {
          message:
            'Si el correo existe, se ha enviado un código de restablecimiento.',
          data,
        };
      } catch (error) {
        Utils.errorResponse(error);
      }
    }
  
    @Post('verify-reset-token')
    async verifyResetToken(@Body('token') token: string) {
      const isValid = await this.authService.verifyResetToken(token);
      if (isValid) {
        return { message: 'Código verificado' };
      } else {
        throw new BadRequestException('Código inválido');
      }
    }
  
    @Post('reset-password')
    async resetPassword(
      @Body('token') token: string,
      @Body('newPassword') newPassword: string,
    ) {
      try {
        await this.authService.resetPassword(token, newPassword);
        return { message: 'Contraseña restablecida con éxito.' };
      } catch (error) {
        return error;
      }
    }
    
  
    @Get('verify')
    async verifyUser(@Req() req: Request, @Res() res: Response) {
      const token = req.cookies['jwt'];
      if (!token) {
        return res.status(401).send({ data: false });
      }
      try {
        const decoded = await this.authService.validateToken(token);
        return res.status(200).send({ data: !!decoded });
      } catch (error) {
        if (error instanceof NotFoundException) {
          return res.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestException) {
          return res.status(400).send({ message: error.message });
        }
        return res.status(500).send({
          message: 'Internal server error',
          error: error.message,
        });
      }
    }
  
    @Get('/validate-sesion')
    async validateSesion(@Req() req: Request, @Res() res: Response){
      const token = req.cookies['jwt'];
      if (!token) {
        return res.status(401).send({ message: 'No token provided' });
      }
      try {
        const decoded = await this.authService.validateToken(token);
        
        return res.status(201).send({ data: true });
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          return res.status(401).send({ message: error.message });
        }
        if (error instanceof BadRequestException) {
          return res.status(400).send({ message: error.message });
        }
        return res.status(500).send({
          message: 'Internal server error',
          error: error.message,
        });
      }
    }
  
    @Post('register-login')
    async RegisterLogin(@Body() body: any, @Res() res: Response) {
      try {
        const user = await this.authService.validateUserRegisterLogin(body.email);
        if (!user) {
          return res.status(401).send({ message: 'Invalid credentials' });
        }
        return this.authService.login(user, res); // Pasa el objeto Response al servicio
      } catch (error) {
        Utils.errorResponse(error);
      }
    }
  }
  