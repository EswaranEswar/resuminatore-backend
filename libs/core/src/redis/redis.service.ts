import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { constants } from '@app/shared';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(constants.REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  private key(key: string) {
    return `app:${key}`;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    const redisKey = this.key(key);
    if (ttlSeconds) {
      return this.redisClient.set(redisKey, value, 'EX', ttlSeconds);
    }
    return this.redisClient.set(redisKey, value);
  }

  async get(key: string) {
    return await this.redisClient.get(this.key(key));
  }

  async del(key: string) {
    return await this.redisClient.del(this.key(key));
  }

  async setJson(key: string, value: any, ttlSeconds?: number) {
    return await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async onModuleDestroy() {
    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.quit();
      }
      console.log('🧹 Redis connection closed gracefully.');
    } catch (err) {
      console.error('Redis shutdown error:', err.message);
    }
  }
}
