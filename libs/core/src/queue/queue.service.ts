import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueEnum } from '@app/shared';
import { EmailJobData } from '../email/email.worker';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QueueEnum.enum.email)
    private readonly emailQueue: Queue,
  ) {}

  async sendEmail(data: EmailJobData) {
    const job = await this.emailQueue.add('send-email', data, {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    });

    this.logger.log(`Email job queued | jobId=${job.id}`);
  }
}

