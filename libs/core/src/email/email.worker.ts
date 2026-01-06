import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BaseWorker } from '../queue/base.worker';
import { QueueEnum } from '@app/shared';
import { EmailService } from './email.service';
import { PinoLogger } from 'nestjs-pino';

export interface EmailJobData {
  email: string;
  mailDetails: {
    subject: string;
    html: string;
    from?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: any[];
  };
}

@Processor(QueueEnum.enum.email)
export class EmailWorker extends BaseWorker {
  constructor(
    private readonly emailService: EmailService,
    protected readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(EmailWorker.name);
  }

  async process(job: Job<EmailJobData>): Promise<string> {
    const { email, mailDetails } = job.data;

    const startMsg = `Sending email to ${email} (Subject: ${mailDetails.subject})`;
    this.logger.info(startMsg);
    await job.log(startMsg);

    await this.emailService.sendEmail(
      email,
      mailDetails.subject,
      mailDetails.html,
    );

    const endMsg = `Email successfully sent to ${email}`;
    this.logger.info(endMsg);
    await job.log(endMsg);

    return 'success';
  }
}
