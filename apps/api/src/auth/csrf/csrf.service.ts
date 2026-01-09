import { Injectable } from '@nestjs/common';
import { getCookieOptions } from '../cookie.config';
import { Response } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CsrfService {
  generateToken(): string {
    return randomUUID();
  }

  setCsrfCookie(res: Response) {
    const token = this.generateToken();
    const { secure, sameSite } = getCookieOptions();

    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure,
      sameSite,
      path: '/',
    });

    return token;
  }
}
