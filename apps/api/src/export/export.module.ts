import { ExportLibModule } from '@app/export';
import { ExportController } from './export.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [ExportLibModule],
  controllers: [ExportController],
})
export class ExportModule {}
