import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OauthStrategy extends PassportStrategy(Strategy, 'oauth') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID')!;
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET')!;
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL')!;

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'select_account',
    } as any);
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    console.log('VALIDATE CALLED → profile:', profile);

    return {
      provider: 'GOOGLE',
      providerId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
    };
  }
}
