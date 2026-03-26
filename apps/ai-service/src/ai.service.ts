import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BASE_SYSTEM_PROMPT } from './prompts/base-system.prompt';
import { ChatMessage } from '@app/shared';

export const DAILY_AI_TOKEN_LIMIT = 80_000;

@Injectable()
export class AiService implements OnModuleInit {
  private readonly geminiModel: any;
  private dailyTokensUsed = 0;

  constructor(private readonly gemini: GoogleGenerativeAI) {
    this.geminiModel = this.gemini.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  resetDailyLimit() {
    this.dailyTokensUsed = 0;
    console.log('Daily AI token limit reset - 80k tokens available');
  }

  onModuleInit() {
    this.resetDailyLimit();
  }

  async generateResponse(messages: ChatMessage[]): Promise<any> {
    if (this.dailyTokensUsed >= DAILY_AI_TOKEN_LIMIT) {
      throw new Error(`Daily limit reached: ${this.dailyTokensUsed}/${DAILY_AI_TOKEN_LIMIT} tokens`);
    }

    const chatHistory = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const prompt = chatHistory.length === 0 
      ? `${BASE_SYSTEM_PROMPT}\n\n${lastMessage.content}`
      : lastMessage.content;

    const chat = this.geminiModel.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(prompt);
    const text = result.response.text();

    const tokensUsed = prompt.length / 4 + text.length / 4;
    this.dailyTokensUsed += tokensUsed;

    return {
      output: text,
      tokensUsed,
      remainingTokens: DAILY_AI_TOKEN_LIMIT - this.dailyTokensUsed,
      provider: 'gemini',
    };
  }
}
