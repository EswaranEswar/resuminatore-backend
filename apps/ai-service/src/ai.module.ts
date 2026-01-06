import { ExecutionContext, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ClsModule, ClsService } from 'nestjs-cls';
import { AiMessageController } from './ai.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreModule } from '@app/core';
import OpenAI from 'openai';

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
      provide: OpenAI,
      useFactory: (configService: ConfigService) =>
        new OpenAI({
          apiKey: configService.get<string>('GEMINI_API_KEY'),
        }),
      inject: [ConfigService],
    },
  ],
})
export class AiModule {}
