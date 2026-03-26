import { Controller, Get, Headers, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { CognitoService } from './cognito.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cognitoService: CognitoService,
  ) {}

  @Public()
  @Get('/signin')
  async handleSignin(@Req() request: Request, @Res() response: Response) {
    if (request.session['isAuthenticated']) {
      return response.json('you are already signed in');
    }
    const signInResult = await this.authService.handleSignin(request);
    return response.json({ msg: 'success', data: signInResult });
  }

  @Public()
  @Get('signout')
  async signOut(@Req() request: Request, @Res() response: Response) {
    await this.authService.handleSignout(request);
    return request.session.destroy(() => {
      return response.json({ message: 'Logged out successfully' });
    });
  }

  @Public()
  @Get('user-pool-client-details')
  async getUserPoolClientDetails(@Headers('referer') referer: string) {
    return await this.cognitoService.getUserPoolClientDetails(referer);
  }
}
