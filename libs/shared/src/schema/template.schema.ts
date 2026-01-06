import { z } from 'zod/v4';
import { BaseSchema, BaseSchemaObject } from './base.schema';
import { createZodDto } from 'nestjs-zod';
import { ResumeSchema, ResumeType, ResumePartialSchema } from './resume.schema';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'modern' | 'creative' | 'professional';
  thumbnailUrl: string;
  isPremium: boolean;
}

export interface TemplateData extends TemplateMetadata {
  sampleData: Partial<ResumeType>;
  htmlStructure?: string;
  cssStyles?: string;
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    headingFont: string;
    layout: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';
    sidebarWidth: string;
    spacing: 'compact' | 'normal' | 'relaxed';
  };
}

export const TemplateStylesSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  fontFamily: z.string(),
  headingFont: z.string(),
  layout: z.enum([
    'single-column',
    'two-column',
    'sidebar-left',
    'sidebar-right',
  ]),
  sidebarWidth: z.string(),
  spacing: z.enum(['compact', 'normal', 'relaxed']),
});

export const TemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(['classic', 'modern', 'creative', 'professional']),
  thumbnailUrl: z.string(),
  isPremium: z.boolean().default(false),
  sampleData: ResumePartialSchema,
  htmlStructure: z.string().optional(),
  cssStyles: z.string().optional(),
  styles: TemplateStylesSchema,
  ...BaseSchema.shape,
});

export type TemplateType = z.infer<typeof TemplateSchema>;
export const CreateTemplateSchema = TemplateSchema.omit(BaseSchemaObject);
export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export class CreateTemplateDto extends createZodDto(CreateTemplateSchema) {}
export class UpdateTemplateDto extends createZodDto(UpdateTemplateSchema) {}
