import { Module } from '@nestjs/common';
import { UserLibModule } from '@app/user';
import { UserController } from './user.controller';

@Module({
  imports: [UserLibModule],
  controllers: [UserController],
})
export class UserModule {}
