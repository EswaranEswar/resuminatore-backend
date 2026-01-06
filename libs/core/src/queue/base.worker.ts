import { WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { Job } from 'bullmq';

export abstract class BaseWorker extends WorkerHost {
  protected abstract readonly logger: PinoLogger;

  @OnWorkerEvent('active')
  async onActive(job: Job) {
    const msg = `===> Job started | id=${job.id} | name=${job.name} | queue=${job.queueName}`;
    this.logger.info(msg);
    await job.log(msg);
  }

  @OnWorkerEvent('progress')
  async onProgress(job: Job) {
    const msg = `===> Job progress | id=${job.id} | ${job.progress}%`;
    this.logger.info(msg);
    await job.log(msg);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    const msg = `===> Job completed | id=${job.id} | name=${job.name}`;
    this.logger.info(msg);
    await job.log(msg);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    const msg = `===> Job failed | id=${job.id} | name=${job.name} | reason=${err.message}`;
    this.logger.error(msg, err.stack);
    await job.log(msg);
    await job.log(`Error stack: ${err.stack}`);
  }
}
