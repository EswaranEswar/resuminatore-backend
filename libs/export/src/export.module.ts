import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ExportService } from './export.service';

@Module({
  imports: [ConfigModule],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportLibModule {}
