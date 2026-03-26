import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLibModule } from '@app/user';
import { AuthController } from './auth.controller';
import { EmailModule, QueueModule, RedisModule } from '@app/core';
import { CognitoService } from './cognito.service';

@Module({
  imports: [UserLibModule, QueueModule, RedisModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, CognitoService],
  exports: [AuthService, CognitoService],
})
export class AuthModule {}
