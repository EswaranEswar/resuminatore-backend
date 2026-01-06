import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BASE_SYSTEM_PROMPT } from './prompts/base-system.prompt';
import { ChatMessage } from '@app/shared';

export const DAILY_AI_TOKEN_LIMIT = 20_000;

@Injectable()
export class AiService {
  private readonly gemini: GoogleGenerativeAI;
  private readonly geminiModel: any;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AiService.name);

    // Initialize Gemini
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
      this.geminiModel = this.gemini.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      this.logger.info('Gemini initialized');
    } else {
      this.logger.warn('GEMINI_API_KEY not found');
    }

    // Ensure at least one AI provider is available
    if (!geminiKey) {
      throw new Error(
        'At least one AI provider API key must be configured (GEMINI_API_KEY)',
      );
    }
  }

  async generateResponse(messages: ChatMessage[]) {
    if (this.geminiModel) {
      return await this.generateWithGemini(messages);
    }

    throw new Error('No AI provider available');
  }

  private async generateWithGemini(messages: ChatMessage[]) {
    try {
      this.logger.info('🤖 Gemini call started');

      // Convert messages to Gemini format
      const chatHistory = messages.slice(0, -1).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const lastMessage = messages[messages.length - 1];

      // Start chat with history
      const chat = this.geminiModel.startChat({
        history: chatHistory,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      });

      // Add system prompt to the first message
      const prompt =
        chatHistory.length === 0
          ? `${BASE_SYSTEM_PROMPT}\n\n${lastMessage.content}`
          : lastMessage.content;

      const result = await chat.sendMessage(prompt);
      const response = result.response;
      const text = response.text();

      this.logger.info('Gemini call finished successfully');

      return {
        output: text,
        tokensUsed: 0, // Gemini doesn't provide token count in the same way
        provider: 'gemini',
      };
    } catch (error: any) {
      this.logger.error('Gemini API Error:', error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }
}
