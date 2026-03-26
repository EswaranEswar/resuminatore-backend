import { z } from 'zod/v4';
import { BaseSchema, BaseSchemaObject } from '../schema/base.schema';
import { createZodDto } from 'nestjs-zod';

export const ProviderEnum = z.enum(['LOCAL', 'GOOGLE', 'GITHUB']);
export const PlanEnum = z.enum(['FREE', 'STANDARD', 'PREMIUM']);
export const RoleEnum = z.enum(['user', 'admin']);

export const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),

  provider: ProviderEnum.default('LOCAL'),
  providerId: z.string().optional(),

  avatar: z.string().url().nullable().optional(),

  isVerified: z.boolean().default(false),
  role: RoleEnum.default('user'),

  planType: PlanEnum.default('FREE'),

  resumeLists: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
    )
    .optional(),

  aiUsage: z
    .object({
      date: z.string().optional(),
      tokensUsed: z.number().optional(),
    })
    .optional(),

  ...BaseSchema.shape,
});

export const CreateUserSchema = UserSchema.omit(BaseSchemaObject);
export const UpdateUserSchema = CreateUserSchema.partial();

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  inviteToken: z.string().optional(),
});

export const SendOtpSchema = z.object({
  email: z.string().email(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  otp: z.string().length(6),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
});

export const OathLoginSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  provider: ProviderEnum,
  providerId: z.string(),
  avatar: z.string().url().optional(),
});

export const GithubGetAccessTokenSchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
  code: z.string(),
});

export type UserType = z.infer<typeof UserSchema>;
export type ProviderType = z.infer<typeof ProviderEnum>;
export class UserDto extends createZodDto(UserSchema) {}
export class CreateUserDto extends createZodDto(CreateUserSchema) {}
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export class LoginDto extends createZodDto(LoginDtoSchema) {}
export class RegisterDto extends createZodDto(RegisterSchema) {}
export class SendOtpDto extends createZodDto(SendOtpSchema) {}
export class VerifyOtpDto extends createZodDto(VerifyOtpSchema) {}
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
export class OathLoginDto extends createZodDto(OathLoginSchema) {}
export class GithubGetAccessTokenDto extends createZodDto(
  GithubGetAccessTokenSchema,
) {}
