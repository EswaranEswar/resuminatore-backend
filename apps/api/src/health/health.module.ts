import { Module } from '@nestjs/common';
import { HealthLibModule } from '@app/core/health/health.module';
import { HealthController } from './health.controller';

@Module({
    imports: [HealthLibModule],
    controllers: [HealthController]
})
export class HealthModule {}
