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
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  VerifyOtpDto,
  SendOtpDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from '@app/shared';
import { Public } from './decorator/public-decorator';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return await this.authService.logout();
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyOtp(verifyOtpDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh() {
    return await this.authService.refreshToken();
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('oauth'))
  async googleAuth() {
    return { message: 'Redirecting to Google...' };
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('oauth'))
  async googleRedirect(@Req() req: any, @Res() res: Response) {
    const result = await this.authService.handleGoogleLogin(req.user);
    const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/success`);
    redirectUrl.searchParams.append('token', result.access_token);
    redirectUrl.searchParams.append('refreshToken', result.refresh_token);

    return res.redirect(redirectUrl.toString());
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return await this.authService.sendOtp(sendOtpDto);
  }
}
