import { Schema } from 'mongoose';
import { BaseDocument, MongoBaseSchema } from './base.schema';

/* ------------------- Core Resume Schema --------------- */
/**
 * Optimized Resume Schema
 * - Uses strict: false to allow dynamic fields from different templates
 * - Only defines core administrative fields
 * - Relies on Zod schema for input validation and normalization
 */
export const MongoResumeSchema = new Schema(
  {
    userId: { type: String, required: false },
    name: { type: String, required: false },
    title: {type: String, required: true},

    templateId: {type: String, required: false},
    appliedTemplate: {
      htmlStructure: String,
      cssStyles: String,
      styles: Schema.Types.Mixed,
    },
    ...MongoBaseSchema.obj,
  },
  {
    strict: false,
    minimize: true, // Automatically removes empty objects
  },
);

/* ------------------- Types --------------------------- */
export interface MongoResume extends BaseDocument {
  userId: string;
  name: string;
  title?: string;
  templateId?: string;
  appliedTemplate?: {
    htmlStructure?: string;
    cssStyles?: string;
    styles?: any;
  };
  // Dynamic fields (Experience, Education, etc.) are handled via the document indexer
  [key: string]: any;
}
