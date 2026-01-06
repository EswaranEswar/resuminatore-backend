import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { QueueAdminAuthMiddleware } from './bull-board-middleware';
import { QueueEnum } from '@app/shared';
import { ConfigModule } from '@nestjs/config';

const queues = Object.keys(QueueEnum.enum).map((name) => ({
  name,
  adapter: BullMQAdapter,
}));

@Module({
  imports: [
    ConfigModule,
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
      middleware: QueueAdminAuthMiddleware,
    }),
    BullBoardModule.forFeature(...queues),
  ],
  exports: [BullBoardModule],
})
export class QueueAdminModule {}
