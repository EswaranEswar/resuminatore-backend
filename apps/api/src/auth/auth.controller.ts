import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Public } from './decorator/public-decorator';

import {
  LoginDto,
  RegisterDto,
  VerifyOtpDto,
  SendOtpDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from '@app/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // LOGIN
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // LOGOUT (auth required)
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return this.authService.logout();
  }

  // VERIFY OTP
  @Public()
  @Throttle({ default: { limit: 5, ttl: 300 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  // REFRESH TOKEN
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh() {
    return this.authService.refreshToken();
  }

  // GOOGLE OAUTH START
  @Public()
  @SkipThrottle()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  // GOOGLE OAUTH CALLBACK
  @Public()
  @SkipThrottle()
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.handleGoogleLogin(req.user, res);
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
    return res.redirect(`${frontendUrl || ''}/`);
  }

  // FORGOT PASSWORD
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // RESET PASSWORD
  @Public()
  @Throttle({ default: { limit: 5, ttl: 300 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // SEND OTP
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  me(@Req() req: any) {
    return {
      user: req.user,
    };
  }
}
