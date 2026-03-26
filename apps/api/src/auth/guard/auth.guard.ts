import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly clsService: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // 2. Default: Check Session Authentication
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      if (!request?.session?.['isAuthenticated']) {
        throw new UnauthorizedException('Session not authenticated');
      }

      // Sync session to CLS
      this.clsService.set('session', request.session);
      if (request.session['user']) {
        this.clsService.set('user', request.session['user']);
      }
    }

    return true;
  }
}
