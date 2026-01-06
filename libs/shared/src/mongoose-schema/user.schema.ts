import { Schema } from 'mongoose';
import { BaseDocument, MongoBaseSchema } from './base.schema';

export const MongoProviderEnum = ['LOCAL', 'GOOGLE', 'GITHUB'] as const;
export const MongoPlanTypeEnum = ['FREE', 'STANDARD', 'PREMIUM'] as const;
export const MongoRoleEnum = ['user', 'admin'] as const;

export const MongoUserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true },

  role: {
    type: String,
    enum: MongoRoleEnum,
    default: MongoRoleEnum[0],
  },

  password: { type: String, required: false },
  avatar: { type: String, default: null },

  provider: {
    type: String,
    enum: MongoProviderEnum,
    default: MongoProviderEnum[0],
  },

  providerId: { type: String, required: false },

  planType: {
    type: String,
    enum: MongoPlanTypeEnum,
    default: MongoPlanTypeEnum[0],
  },

  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  isVerified: { type: Boolean, default: false },

  resumeLists: {
    type: [
      {
        id: { type: String },
        name: { type: String },
        createdAt: { type: String },
        updatedAt: { type: String },
      },
    ],
    default: [],
  },
  resetPasswordToken: { type: String, default: null },
  resetPasswordTokenExpiry: { type: Date, default: null },

  aiUsage: {
    date: { type: String },
    tokensUsed: { type: Number, default: 0 },
  },

  refreshToken: { type: String, default: null },

  ...MongoBaseSchema.obj,
});

export interface MongoUser extends BaseDocument {
  name: string;
  email: string;
  role: (typeof MongoRoleEnum)[number];
  password?: string;
  avatar?: string | null;

  provider: (typeof MongoProviderEnum)[number];
  providerId?: string;

  planType: (typeof MongoPlanTypeEnum)[number];

  otp?: string | null;
  otpExpiry?: Date | null;

  isVerified: boolean;

  resumeLists: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;

  resetPasswordToken?: string | null;
  resetPasswordTokenExpiry?: Date | null;

  aiUsage?: {
    date?: string;
    tokensUsed?: number;
  };

  refreshToken?: string | null;
}
