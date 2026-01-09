import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { ChatMessage, MessageTopic } from '@app/shared';
import { PinoLogger } from 'nestjs-pino';

@Controller()
export class AiMessageController {
  constructor(
    private readonly aiService: AiService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AiMessageController.name);
  }

  @MessagePattern(MessageTopic.AI_GENERATE)
  async generate(@Payload() data: { messages: ChatMessage[] }) {
    this.logger.info('AI received messages', data.messages);
    return this.aiService.generateResponse(data.messages);
  }
}
