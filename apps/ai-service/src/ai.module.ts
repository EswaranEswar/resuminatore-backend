import { ExecutionContext, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ClsModule, ClsService } from 'nestjs-cls';
import { AiMessageController } from './ai.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreModule } from '@app/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const clsSetupHelper = (cls: ClsService, context: ExecutionContext) => {
  try {
    let session: Record<string, any> | null = null;

    if (context.getType() === 'rpc') {
      session = context.switchToRpc().getData()['headers']?.['session'];
    }
    cls.set('session', session);
  } catch (e: any) {
    throw new Error(e.message);
  }
};

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClsModule.forRoot({
      global: true,
      guard: {
        mount: true,
        setup: clsSetupHelper,
      },
    }),
  ],
  controllers: [AiMessageController],
  providers: [
    AiService,
    {
      provide: GoogleGenerativeAI,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
          throw new Error(
            'GEMINI_API_KEY is not defined in environment variables',
          );
        }
        // Handle docker env_file quirks: quotes are part of value, inline comments are part of value
        const sanitizedKey = apiKey
          .split('#')[0]
          .replace(/^["']|["']$/g, '')
          .trim();
        console.log(
          `CoreModule: GEMINI_API_KEY loaded (Length: ${sanitizedKey.length}, Starts: ${sanitizedKey.substring(0, 4)}...)`,
        );
        return new GoogleGenerativeAI(sanitizedKey);
      },
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
