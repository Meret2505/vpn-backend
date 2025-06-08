import { Controller, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('register')
  register(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.adminService.register(username, password);
  }

  @Post('login')
  login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.adminService.login(username, password);
  }
}
