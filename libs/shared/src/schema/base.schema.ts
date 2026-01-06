import { z } from 'zod/v4';

export const BaseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  updatedAt: z.string(),
  updatedBy: z.string(),
  deletedAt: z.string().optional(),
  deletedBy: z.string().optional(),
});

export const BaseSchemaObject: {
  id?: true | undefined;
  createdAt?: true | undefined;
  createdBy?: true | undefined;
  updatedAt?: true | undefined;
  updatedBy?: true | undefined;
  deletedAt?: true | undefined;
  deletedBy?: true | undefined;
} = {
  id: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  deletedAt: true,
  deletedBy: true,
};

export type BaseSchemaType = z.infer<typeof BaseSchema>;
