import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'SECRET_KHUSUS_MONEE', 
    });
  }

  async validate(payload: any) {
    // Data yang dikembalikan di sini akan muncul di req.user
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}