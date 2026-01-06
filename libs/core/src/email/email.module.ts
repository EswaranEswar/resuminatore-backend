import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { emailTransporterProvider } from './email.config';
import { EmailWorker } from './email.worker';

@Module({
  providers: [
    emailTransporterProvider,
    EmailService,
    EmailWorker,
  ],
  exports: [EmailService],
})
export class EmailModule {}
