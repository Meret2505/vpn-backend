import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admin.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    JwtModule.register({ secret: 'secret', signOptions: { expiresIn: '7d' } }),
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtStrategy],
  exports: [AdminService],
})
export class AdminModule {}
