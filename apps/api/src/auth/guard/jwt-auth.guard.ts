import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorator/public-decorator';
import { jwtConstants } from '../constants/auth.constants';
import { ClsService } from 'nestjs-cls';
import { constants } from '@app/shared';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private cls: ClsService,
    @Inject(constants.REDIS_CLIENT) private redis: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    const blacklisted = await this.redis.get(`blacklist:${token}`);
    if (blacklisted) {
      throw new UnauthorizedException('Token is revoked (logged out)');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      const user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      request.user = user;

      this.cls.set('session', {
        ...this.cls.get('session'),
        user,
      });

      this.logger.log(`Request from connected user: ${payload.email}`);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization?.split(' ')[1];
    const cookieToken = request.cookies?.access_token;
    return authHeader || cookieToken;
  }
}
