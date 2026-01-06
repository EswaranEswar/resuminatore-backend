import { ChatMessage } from '@app/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  constructor(@Inject('AI_SERVICE') private readonly aiClient: ClientProxy) {}

  async generate(messages: ChatMessage[]) {
    // In ai-client.service.ts
    const result = await firstValueFrom(
      this.aiClient.send('ai_generate', { messages }),
    );
    return result;
  }
}
