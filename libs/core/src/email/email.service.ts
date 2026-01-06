import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Transporter } from 'nodemailer';
import { EmailTemplates } from './email-templates';
import { constants } from '@app/shared';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(constants.EMAIL_TRANSPORTER)
    private readonly transporter: Transporter,
  ) {}

  async onModuleInit() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
    } catch (err) {
      this.logger.error('SMTP verification failed', err);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    options?: {
      from?: string;
      cc?: string[];
      bcc?: string[];
      attachments?: any[];
    },
  ) {
    await this.transporter.sendMail({
      from: options?.from || `"Resume Builder" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      cc: options?.cc,
      bcc: options?.bcc,
      attachments: options?.attachments,
      text: subject,
    });
  }


  sendOtpEmail(to: string, name: string, otp: string) {
    return this.sendEmail(to, 'Your OTP Code', EmailTemplates.otp(name, otp));
  }

  sendWelcomeEmail(to: string, name: string) {
    return this.sendEmail(to, 'Welcome!', EmailTemplates.welcome(name));
  }

  sendPasswordResetEmail(to: string, name: string, link: string) {
    return this.sendEmail(
      to,
      'Password Reset Request',
      EmailTemplates.passwordReset(name, link),
    );
  }
}
