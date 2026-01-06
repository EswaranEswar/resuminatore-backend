import { Schema } from 'mongoose';
import { BaseDocument, MongoBaseSchema } from './base.schema';

export const MongoTemplateSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['classic', 'modern', 'creative', 'professional'],
    required: true,
  },
  thumbnailUrl: { type: String },
  previewUrl: { type: String },
  placeholders: [{ type: String }],
  isPremium: { type: Boolean, default: false },
  sampleData: { type: Schema.Types.Mixed },
  htmlStructure: { type: String },
  cssStyles: { type: String },
  styles: {
    primaryColor: { type: String },
    secondaryColor: { type: String },
    accentColor: { type: String },
    fontFamily: { type: String },
    headingFont: { type: String },
    layout: {
      type: String,
      enum: ['single-column', 'two-column', 'sidebar-left', 'sidebar-right'],
    },
    sidebarWidth: { type: String },
    spacing: {
      type: String,
      enum: ['compact', 'normal', 'relaxed'],
    },
  },
  ...MongoBaseSchema.obj,
});

export interface MongoTemplate extends BaseDocument {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'modern' | 'creative' | 'professional';
  thumbnailUrl: string;
  previewUrl?: string;
  placeholders?: string[];
  isPremium: boolean;
  sampleData: any;
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
