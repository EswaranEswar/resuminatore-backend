import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AiClientService } from './ai-client.service';
import { ClsModule } from 'nestjs-cls';
import { AiClientController } from './ai-client.controller';
import { getRedisTransportOption } from '@app/core';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClsModule,
    ClientsModule.registerAsync([
      {
        name: 'AI_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) =>
          getRedisTransportOption(configService),
      },
    ]),
  ],
  controllers: [AiClientController],
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiClientModule {}
