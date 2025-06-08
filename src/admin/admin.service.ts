import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private adminRepo: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const admin = this.adminRepo.create({ username, password: hash });
    return this.adminRepo.save(admin);
  }

  async login(username: string, password: string) {
    const admin = await this.adminRepo.findOneBy({ username });
    if (!admin) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const payload = { sub: admin.id, username: admin.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateAdmin(adminId: string) {
    return this.adminRepo.findOneBy({ id: adminId });
  }
}
