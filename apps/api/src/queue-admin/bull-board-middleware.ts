import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class QueueAdminAuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const username = this.configService.get<string>('BULLBOARD_USER');
    const password = this.configService.get<string>('BULLBOARD_PASS');

    if (!username || !password) {
      throw new Error('BullBoard credentials not configured');
    }

    const encodedCreds = Buffer.from(`${username}:${password}`).toString(
      'base64',
    );

    const authHeader = req.headers['authorization'];
    const reqCreds = authHeader?.startsWith('Basic ')
      ? authHeader.slice(6)
      : null;

    if (reqCreds !== encodedCreds) {
      res.setHeader('WWW-Authenticate', 'Basic realm="BullBoard"');
      return res.sendStatus(401);
    }

    next();
  }
}
