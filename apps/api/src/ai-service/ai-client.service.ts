import { ChatMessage } from '@app/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { constants } from '@app/shared';
import { firstValueFrom } from 'rxjs';
import { MessageTopic } from '@app/shared';

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  constructor(@Inject(constants.AI_SERVICE) private readonly aiClient: ClientProxy) {}

  async generate(messages: ChatMessage[]) {
    // In ai-client.service.ts
    const result = await firstValueFrom(
      this.aiClient.send(MessageTopic.AI_GENERATE, { messages }),
    );
    return result;
  }
}
