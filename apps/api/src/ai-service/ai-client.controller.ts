import { ChatMessage } from '@app/shared';
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Public } from '../auth/decorator/public-decorator';
import { SkipCsrf } from '../auth/decorator/csrf.decorator';
import { AiClientService } from './ai-client.service';

@Controller('ai')
export class AiClientController {
  constructor(private readonly aiClientService: AiClientService) {}

  @Public()
  @SkipCsrf()
  @Post('generate')
  async generate(@Body() body: { messages: ChatMessage[] }) {
    console.log('Sending to AI', body.messages);
    return this.aiClientService.generate(body.messages);
  }
}
