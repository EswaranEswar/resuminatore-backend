import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '@app/user';
import { UserType } from '@app/shared';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get('profile')
  async getProfile() {
    return this.userService.getProfile();
  }

  @Patch('profile')
  async updateProfile(@Body() body: Partial<UserType>) {
    return this.userService.updateProfile(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAll() {
    return this.userService.getAllUsers();
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: 'admin' | 'user',
  ) {
    return this.userService.updateUserRole(id, role);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() update: Partial<UserType>) {
    return this.userService.updateUserById(id, update);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return this.userService.deleteUserById(id);
  }

  @Get(':id')
  async findUserById(@Param('id') id: string) {
    return this.userService.findByUserId(id);
  }
}
