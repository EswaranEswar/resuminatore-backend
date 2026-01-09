import { Module } from '@nestjs/common';
import { HealthService } from './health.service';
import { MongodbLibModule } from '../mongodb/mongodb.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    MongodbLibModule
  ],
  providers: [HealthService],
  exports: [HealthService]
})
export class HealthLibModule {}
