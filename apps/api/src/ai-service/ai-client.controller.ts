import { ChatMessage, MessageTopic, constants } from '@app/shared';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Public } from '../auth/decorator/public-decorator';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Controller('ai')
export class AiClientController {
  constructor(@Inject(constants.AI_SERVICE) private readonly aiClient: ClientProxy) {}
  @Public()
  @Post('generate')
  async generate(@Body() messages: ChatMessage[]) {
    const result = await firstValueFrom(
      this.aiClient.send(MessageTopic.AI_GENERATE, { messages }),
    );
    return result;
  }
}

