import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { constants } from '@app/shared';
import { MongodbService } from '@app/core';

@Injectable()
export class HealthService {
  constructor(
    private readonly mongodbService: MongodbService,
    @Inject(constants.REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async isHealthy() {
    const mongo = await this.mongodbService.isHealthy();
    const redisOk = await this.checkRedis();

    return {
      status: mongo && redisOk ? 'ok' : 'error',
      mongo,
      redis: redisOk,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}

