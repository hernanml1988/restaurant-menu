// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extraemos la tarjeta desde el header Authorization
      ignoreExpiration: false,
      secretOrKey: 'secretKey', // La firma secreta del parque
    });
  }

  async validate(payload: any) {
    // Verificamos si la tarjeta JWT es válida
    return { userId: payload.sub, username: payload.username };
  }
}
