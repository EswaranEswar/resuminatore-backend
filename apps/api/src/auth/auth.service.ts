import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';
import { UserService } from '@app/user';
import { CognitoService } from './cognito.service';
import { RedisService, EmailTemplates, QueueService } from '@app/core';
import { UserType } from '@app/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    private readonly clsService: ClsService,
    private readonly configService: ConfigService,
    private readonly cognitoService: CognitoService,
    private readonly queueService: QueueService,
  ) {}

  async handleSignin(request: Request) {
    this.logger.log(`Request auth headers: ${JSON.stringify(request.headers)}`);

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Bearer token not found');
    }

    const accessToken = authHeader.substring(7);

    // 1. Verify token with Cognito
    const userPoolId = this.configService.get<string>('COGNITO_USER_POOL_ID');
    const clientId = this.configService.get<string>('COGNITO_CLIENT_ID');

    const verifier = CognitoJwtVerifier.create({
      userPoolId: userPoolId!,
      tokenUse: 'access',
      clientId: clientId!,
    });

    try {
      await verifier.verify(accessToken);
    } catch (err) {
      this.logger.error(`Token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid bearer token');
    }

    // 2. Fetch User Profile from Cognito
    const authenticateResult =
      await this.cognitoService.getUserProfile(accessToken);
    const email = authenticateResult.UserAttributes?.find(
      (attr) => attr.Name === 'email',
    )?.Value;
    const name =
      authenticateResult.UserAttributes?.find((attr) => attr.Name === 'name')
        ?.Value || email;

    if (!email) {
      throw new BadRequestException(
        'Email attribute not found in Cognito profile',
      );
    }

    // 3. JIT Provisioning
    let user = await this.userService.findByEmail(email);
    if (!user) {
      this.logger.log(`Provisioning new local user for: ${email}`);
      user = await this.userService.createUser({
        name,
        email,
        isVerified: true,
      } as any);

      // Self-link createdBy/updatedBy
      await this.userService.updateUserByEmail(email, {
        createdBy: user.id,
        updatedBy: user.id,
      });

      // Send welcome email
      await this.queueService.sendEmail({
        email: user.email,
        mailDetails: {
          subject: 'Welcome to Resuminatore!',
          html: EmailTemplates.welcome(user.name),
        },
      });
    }

    // 4. Setup Session
    request.session['isAuthenticated'] = true;
    request.session['user'] = this.safeUser(user);
    request.session['accessToken'] = accessToken;

    // Track active session IDs in Redis
    const sessionKey = `user_sessions:${user.id}`;
    const availableSessionIds =
      (await this.redisService.getJson<string[]>(sessionKey)) || [];
    await this.redisService.setJson(sessionKey, [
      ...new Set([...availableSessionIds, request.sessionID]),
    ]);

    this.logger.log(`User logged in: ${email}`);
    return request.session['user'];
  }

  async handleSignout(request: Request) {
    if (request.session['user']) {
      const user = request.session['user'] as any;
      const sessionKey = `user_sessions:${user.id}`;
      const availableSessionIds =
        (await this.redisService.getJson<string[]>(sessionKey)) || [];
      const updatedSessionIds = availableSessionIds.filter(
        (id) => id !== request.sessionID,
      );

      if (updatedSessionIds.length > 0) {
        await this.redisService.setJson(sessionKey, updatedSessionIds);
      } else {
        await this.redisService.del(sessionKey);
      }
    }
    return 'success';
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
