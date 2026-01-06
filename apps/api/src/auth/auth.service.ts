import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '@app/user';

import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  SendOtpDto,
  ResetPasswordDto,
  OathLoginDto,
  constants,
  UserType,
} from '@app/shared';

import { ClsService } from 'nestjs-cls';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '@app/core';
import { EmailTemplates } from '@app/core';
import Redis from 'ioredis';
import { hashConstants, jwtConstants } from './constants/auth.constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UserService,

    private jwtService: JwtService,
    private clsService: ClsService,
    private config: ConfigService,
    private queueService: QueueService,
    @Inject(constants.REDIS_CLIENT) private redis: Redis,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new UnauthorizedException('User already exists');

    if (dto.password !== dto.confirmPassword)
      throw new BadRequestException('Passwords do not match');

    const hashed = await bcrypt.hash(dto.password, hashConstants.saltRounds);

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.usersService.createUser({
      name: dto.fullName,
      email: dto.email,
      password: hashed,
      otp,
      otpExpiry,
    });

    await this.usersService.updateUserByEmail(user.email, {
      createdBy: user.id,
      updatedBy: user.id,
    });

    this.clsService.set('session', {
      ...this.clsService.get('session'),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    if (!user.email) throw new UnauthorizedException('User email not found');

    await this.queueService.sendEmail({
      email: user.email,
      mailDetails: {
        subject: 'OTP Code',
        html: EmailTemplates.otp(user.name || '', user.otp || ''),
      },
    });

    this.logger.log(
      `New user registered: ${user.email} (ID: ${user.id}, Name: ${user.name})`,
    );
    return { message: 'OTP sent to email. Please verify your account.', user };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.otp || !user.otpExpiry)
      throw new UnauthorizedException('No OTP generated');

    if (user.otpExpiry < new Date())
      throw new UnauthorizedException('OTP expired');

    if (dto.otp !== user.otp) throw new UnauthorizedException('Invalid OTP');

    await this.usersService.verifyUser(dto.email);

    // await this.emailService.sendWelcomeEmail(dto.email, user.name);
    await this.queueService.sendEmail({
      email: user.email,
      mailDetails: {
        subject: 'Welcome!',
        html: EmailTemplates.welcome(user.name),
      },
    });

    return {
      ...(await this.generateAndSetTokens(user)),
      message: 'Account verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planType: user.planType,
        avatar: user.avatar,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified)
      throw new UnauthorizedException(
        'Account not verified. Please verify OTP first.',
      );

    if (!user.password) throw new UnauthorizedException('Password not found');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return {
      ...(await this.generateAndSetTokens(user)),
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planType: user.planType,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  async sendOtp(dto: SendOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('User not found');

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.updateUserByEmail(dto.email, { otp, otpExpiry });
    await this.queueService.sendEmail({
      email: user.email,
      mailDetails: {
        subject: 'OTP Code',
        html: EmailTemplates.otp(user.name, otp),
      },
    });

    return { message: 'OTP resent successfully' };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');

    const resetToken = this.generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await this.usersService.updateUserByEmail(email, {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiry: resetTokenExpiry,
    });

    const resetLink = `${this.config.get<string>(
      'FRONTEND_URL',
    )}/reset-password?token=${encodeURIComponent(
      resetToken,
    )}&email=${encodeURIComponent(email)}`;

    await this.queueService.sendEmail({
      email,
      mailDetails: {
        subject: 'Password Reset Request',
        html: EmailTemplates.passwordReset(user.name, resetLink),
      },
    });

    return { message: 'Password reset link sent to email' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.resetPasswordToken || !user.resetPasswordTokenExpiry)
      throw new UnauthorizedException('No reset token generated');

    if (user.resetPasswordTokenExpiry < new Date())
      throw new UnauthorizedException('Reset token expired');

    if (user.resetPasswordToken !== dto.token)
      throw new UnauthorizedException('Invalid reset token');

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      hashConstants.saltRounds,
    );

    const updatedPassword = await this.usersService.updateUserByEmail(
      dto.email,
      {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    );

    return { message: 'Password reset successfully', updatedPassword };
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  async logout() {
    const req = this.clsService.get('req') as any;
    const token =
      req?.headers?.authorization?.split(' ')[1] || req?.cookies?.access_token;
    const userId = this.clsService.get('session')?.user?.id;

    const decoded: any = token ? this.jwtService.decode(token) : null;
    const ttl = decoded?.exp - Math.floor(Date.now() / 1000);

    // Blacklist the access token
    if (token) {
      await this.redis.set(`blacklist:${token}`, '1', 'EX', ttl > 0 ? ttl : 10);
    }

    // Clear refresh token from DB
    if (userId) {
      const user = await this.usersService.findByUserId(userId);
      if (user) {
        await this.usersService.updateUserByEmail(user.email, {
          refreshToken: null,
        });
      }
    }

    // Clear cookies
    const res = this.clsService.get<Response>('res');
    if (res) {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
    }

    this.logger.log(
      `User logged out: ${decoded?.email || userId} (ID: ${userId})`,
    );
    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken?: string) {
    try {
      const req = this.clsService.get('req') as any;
      const token = refreshToken || req?.cookies?.refresh_token;

      if (!token) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const decoded = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      const user = await this.usersService.findByUserId(decoded.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(token, user.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return await this.generateAndSetTokens(user);
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateAndSetTokens(user: UserType) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    await this.usersService.updateUserByEmail(user.email, {
      refreshToken: await bcrypt.hash(refreshToken, hashConstants.saltRounds),
    });

    this.setAuthCookies(accessToken, refreshToken);

    // Ensure session is set for the current request context
    this.clsService.set('session', {
      ...this.clsService.get('session'),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      expiresIn: jwtConstants.accessExpiry as any,
    });
  }

  private generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      expiresIn: jwtConstants.refreshExpiry as any,
    });
  }

  async handleGoogleLogin(dto: OathLoginDto) {
    try {
      this.logger.log(`Handling Google login for email: ${dto.email}`);

      if (!dto.email) {
        this.logger.error('Google login failed: No email provided in DTO');
        throw new UnauthorizedException(
          'Google login failed: No email provided',
        );
      }

      let user = await this.usersService.findByEmail(dto.email);

      if (!user) {
        this.logger.log(`Creating new user for email: ${dto.email}`);
        // New user from Google
        user = await this.usersService.createUser({
          name: dto.name,
          email: dto.email,
          provider: 'GOOGLE',
          providerId: dto.providerId,
          avatar: dto.avatar,
          isVerified: true,
        });

        this.logger.log(`User created successfully: ${user.id}.`);

        // Update user with audit fields
        await this.usersService.updateUserByEmail(user.email, {
          createdBy: user.id,
          updatedBy: user.id,
        });
      } else {
        this.logger.log(`Existing user found: ${user.id}. Linking OAuth.`);
        // Existing user → update OAuth connection
        await this.usersService.linkOAuthToExistingUser({
          email: user.email,
          provider: 'GOOGLE',
          providerId: dto.providerId,
          avatar: dto.avatar,
        });
      }

      return {
        ...(await this.generateAndSetTokens(user)),
        message: 'Google login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          planType: user.planType,
          avatar: user.avatar,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error in handleGoogleLogin: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private setAuthCookies(accessToken: string, refreshToken: string) {
    const res = this.clsService.get<Response>('res');

    if (!res) {
      this.logger.warn('Response object not found in CLS context');
      return;
    }
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/auth/refresh', // Restricted path for refresh token
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
