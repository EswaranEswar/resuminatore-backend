import { Module } from '@nestjs/common';
import { MongodbService } from './mongodb.service';
import { UtilsModule } from '@app/utils';

@Module({
  imports: [UtilsModule],
  providers: [MongodbService],
  exports: [MongodbService],
})
export class MongodbLibModule {}
