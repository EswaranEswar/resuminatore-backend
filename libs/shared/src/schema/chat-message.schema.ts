import { BadRequestException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'system', 'assistant']),
  content: z.string().min(1),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export class ChatDto extends createZodDto(ChatRequestSchema) {
  static parse(body: unknown) {
    try {
      return ChatRequestSchema.parse(body);
    } catch (e) {
      throw new BadRequestException(e.errors);
    }
  }
}
