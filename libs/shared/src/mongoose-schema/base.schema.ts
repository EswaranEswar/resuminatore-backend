import { Schema, Document } from 'mongoose';

export const MongoBaseSchema = new Schema({
  createdAt: { type: String, required: false },
  createdBy: { type: String, required: false },
  updatedAt: { type: String, required: false },
  updatedBy: { type: String, required: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
});

export interface BaseDocument extends Document {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  deletedAt?: string;
  deletedBy?: string;
}
