import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongodbLibModule } from '@app/core';
import { UserRepository } from './user.repository';
import { UtilsModule } from '@app/utils';

@Module({
  imports: [MongodbLibModule, UtilsModule],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserLibModule {}
