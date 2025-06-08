import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private adminService: AdminService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secret', // move this to env later
    });
  }

  async validate(payload: any) {
    return this.adminService.validateAdmin(payload.sub);
  }
}
