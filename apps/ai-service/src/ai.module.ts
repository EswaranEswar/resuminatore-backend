import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiMessageController } from './ai.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreModule } from '@app/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    CoreModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AiMessageController],
  providers: [
    AiService,
    {
      provide: GoogleGenerativeAI,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          throw new Error('GEMINI_API_KEY is not defined');
        }
        const sanitizedKey = apiKey.split('#')[0].replace(/^["']|["']$/g, '').trim();
        if (sanitizedKey.length < 10) {
          throw new Error('Invalid GEMINI_API_KEY format');
        }
        console.log('GEMINI_API_KEY loaded successfully');
        return new GoogleGenerativeAI(sanitizedKey);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AiService],
})
export class AiModule {}
