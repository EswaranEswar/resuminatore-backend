import { z } from 'zod/v4';
import { BaseSchema, BaseSchemaObject } from './base.schema';
import { createZodDto } from 'nestjs-zod';

/* -------------------- Smart Normalizer -------------------- */
const dynamicNormalizer = (data: any) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

  const processed: any = { ...data };

  for (const key in processed) {
    const val = processed[key];

    // Handle array-like objects from frontend
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const keys = Object.keys(val);
      const isNumericKeys =
        keys.length > 0 && keys.every((k) => !isNaN(Number(k)));

      if (isNumericKeys) {
        const asArray = Object.entries(val)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([_, v]) => v);

        // Only keep if not empty
        processed[key] = asArray.length > 0 ? asArray : undefined;
      } else if (Object.keys(val).length === 0) {
        // Deep remove empty objects
        processed[key] = undefined;
      }
    } else if (Array.isArray(val) && val.length === 0) {
      // Remove empty arrays
      processed[key] = undefined;
    }
  }

  return processed;
};

/* -------------------- Dynamic Resume Schema -------------- */
export const ResumeObject = z
  .object({
    userId: z.string().optional(),
    name: z.string().optional(),
    title: z.string().optional(),
    templateId: z.string().optional(),
    appliedTemplate: z
      .object({
        htmlStructure: z.string().optional(),
        cssStyles: z.string().optional(),
        styles: z.any().optional(),
      })
      .optional(),
    ...BaseSchema.partial().shape,
  })
  .passthrough();

export const ResumeSchema = z.preprocess(dynamicNormalizer, ResumeObject);

export type ResumeType = z.infer<typeof ResumeSchema>;

export const ResumePartialSchema = z.preprocess(
  dynamicNormalizer,
  ResumeObject.partial(),
);

export const CreateResumeSchema = ResumeSchema;
export const UpdateResumeSchema = ResumePartialSchema;

export type CreateResume = z.infer<typeof CreateResumeSchema>;
export type UpdateResume = z.infer<typeof UpdateResumeSchema>;

export class CreateResumeDto extends createZodDto(CreateResumeSchema as any) {}
export class UpdateResumeDto extends createZodDto(UpdateResumeSchema as any) {}

export const ApplyTemplateSchema = z.object({
  resumeId: z.string().optional(),
  templateId: z.string(),
});

export class ApplyTemplateDto extends createZodDto(ApplyTemplateSchema) {}
