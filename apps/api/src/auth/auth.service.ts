import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import Redis from 'ioredis';

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
import { QueueService, EmailTemplates } from '@app/core';
import { hashConstants, jwtConstants } from './constants/auth.constants';
import { CsrfService } from './csrf/csrf.service';
import { getCookieOptions } from './cookie.config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
    private readonly clsService: ClsService,
    private readonly config: ConfigService,
    private readonly queueService: QueueService,
    private readonly csrfService: CsrfService,
    @Inject(constants.REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ─────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new UnauthorizedException('User already exists');

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

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

    await this.queueService.sendEmail({
      email: user.email,
      mailDetails: {
        subject: 'OTP Code',
        html: EmailTemplates.otp(user.name || '', otp),
      },
    });

    return { message: 'OTP sent to email. Please verify your account.' };
  }

  // ─────────────────────────────────────────────
  // VERIFY OTP
  // ─────────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.otp || !user.otpExpiry) {
      throw new UnauthorizedException('Invalid OTP request');
    }

    if (user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    if (dto.otp !== user.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await this.usersService.verifyUser(dto.email);

    await this.queueService.sendEmail({
      email: user.email,
      mailDetails: {
        subject: 'Welcome!',
        html: EmailTemplates.welcome(user.name),
      },
    });

    await this.generateAndSetTokens(user);

    return {
      message: 'Account verified successfully',
      user: this.safeUser(user),
    };
  }

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Account not verified');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.generateAndSetTokens(user);

    const origin = this.clsService.get('req')?.headers?.origin;
    this.logger.log(
      `User logged in: ${user.email} from origin: ${origin || 'direct/unknown'}`,
    );

    return {
      message: 'Login successful',
      user: this.safeUser(user),
    };
  }

  async sendOtp(dto: SendOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await this.usersService.updateUserByEmail(dto.email, {
      otp,
      otpExpiry,
    });

    await this.queueService.sendEmail({
      email: user.email,
      mailDetails: {
        subject: 'OTP Code',
        html: EmailTemplates.otp(user.name || '', otp),
      },
    });

    this.logger.log(`OTP sent to ${user.email}`);

    return {
      message: 'OTP sent successfully',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await this.usersService.updateUserByEmail(email, {
      resetPasswordToken: resetToken,
      resetPasswordTokenExpiry: resetTokenExpiry,
    });

    const frontendUrl = this.config
      .get<string>('FRONTEND_URL')
      ?.replace(/\/$/, '');
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(
      resetToken,
    )}&email=${encodeURIComponent(email)}`;

    await this.queueService.sendEmail({
      email,
      mailDetails: {
        subject: 'Password Reset Request',
        html: EmailTemplates.passwordReset(user.name, resetLink),
      },
    });

    this.logger.log(`Password reset link sent to ${email}`);

    return {
      message: 'Password reset link sent to email',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.resetPasswordToken || !user.resetPasswordTokenExpiry) {
      throw new UnauthorizedException('No reset token found');
    }

    if (user.resetPasswordTokenExpiry < new Date()) {
      throw new UnauthorizedException('Reset token expired');
    }

    if (user.resetPasswordToken !== dto.token) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      hashConstants.saltRounds,
    );

    await this.usersService.updateUserByEmail(dto.email, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    });

    this.logger.log(`Password reset successful for ${dto.email}`);

    return {
      message: 'Password reset successfully',
    };
  }

  // ─────────────────────────────────────────────
  // GOOGLE OAUTH
  // ─────────────────────────────────────────────
  async handleGoogleLogin(dto: OathLoginDto, res: Response) {
    if (!dto.email) {
      throw new UnauthorizedException('Google login failed');
    }

    let user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      user = await this.usersService.createUser({
        name: dto.name,
        email: dto.email,
        provider: 'GOOGLE',
        providerId: dto.providerId,
        avatar: dto.avatar,
        isVerified: true,
      });

      await this.usersService.updateUserByEmail(user.email, {
        createdBy: user.id,
        updatedBy: user.id,
      });
    } else {
      await this.usersService.linkOAuthToExistingUser({
        email: user.email,
        provider: 'GOOGLE',
        providerId: dto.providerId,
        avatar: dto.avatar,
      });
    }

    // set cookies via CLS
    this.clsService.set('res', res);
    await this.generateAndSetTokens(user);

    return {
      message: 'Google login successful',
      user: this.safeUser(user),
    };
  }

  // ─────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────
  async refreshToken() {
    const req = this.clsService.get('req') as any;
    const token = req?.cookies?.refresh_token;

    if (!token) throw new UnauthorizedException('No refresh token');

    const decoded = await this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });

    const user = await this.usersService.findByUserId(decoded.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(token, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    await this.generateAndSetTokens(user);
    return { message: 'Token refreshed' };
  }

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────
  async logout() {
    const res = this.clsService.get<Response>('res');
    if (res) {
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });
    }
    return { message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────────
  // INTERNAL TOKEN LOGIC (SINGLE SOURCE)
  // ─────────────────────────────────────────────
  private async generateAndSetTokens(user: UserType) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      planType: user.planType,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConstants.accessExpiry,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: jwtConstants.refreshExpiry,
    });

    await this.usersService.updateUserByEmail(user.email, {
      refreshToken: await bcrypt.hash(refreshToken, hashConstants.saltRounds),
    });

    const res = this.clsService.get<Response>('res');
    if (!res) {
      this.logger.error(
        'No Response object found in CLS. Tokens not set in cookies.',
      );
      return;
    }

    const { secure, sameSite } = getCookieOptions();

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // CSRF cookie (JS readable)
    this.csrfService.setCsrfCookie(res);
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private safeUser(user: UserType) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      planType: user.planType,
      role: user.role,
    };
  }
}
