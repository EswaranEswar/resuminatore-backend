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

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile() {
    return this.userService.getProfile();
  }

  @Patch('profile')
  async updateProfile(@Body() body: Partial<UserType>) {
    return this.userService.updateProfile(body);
  }

  @Get()
  async findAll() {
    return this.userService.getAllUsers();
  }

  @Patch(':id/role')
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
  async delete(@Param('id') id: string) {
    return this.userService.deleteUserById(id);
  }

  @Get(':id')
  async findUserById(@Param('id') id: string) {
    return this.userService.findByUserId(id);
  }
}
