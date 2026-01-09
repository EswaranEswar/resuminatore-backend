import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BASE_SYSTEM_PROMPT } from './prompts/base-system.prompt';
import { ChatMessage } from '@app/shared';

export const DAILY_AI_TOKEN_LIMIT = 20_000;

@Injectable()
export class AiService {
  private readonly geminiModel: any;

  constructor(
    private readonly logger: PinoLogger,
    private readonly gemini: GoogleGenerativeAI,
  ) {
    this.logger.setContext(AiService.name);

    this.geminiModel = this.gemini.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
    this.logger.info('Gemini initialized successfully');
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
      // @ts-ignore
      const currentKey = this.gemini.apiKey;
      if (currentKey) {
        this.logger.info(
          `Runtime Key Check: Length=${currentKey.length}, Starts=${currentKey.substring(0, 5)}`,
        );
      } else {
        this.logger.error(
          'Runtime Key Check: Key is undefined/null on this.gemini instance!',
        );
      }

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
        tokensUsed: 0,
        provider: 'gemini',
      };
    } catch (error: any) {
      this.logger.error('Gemini API Error:', error);
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }
}
