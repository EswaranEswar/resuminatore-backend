import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateRepository } from './template.repository';
import { TemplateUploadService } from './template-upload.service';
import { MongodbLibModule } from '@app/core';
import { UtilsModule } from '@app/utils';
import { ExportLibModule } from '@app/export';

@Module({
  imports: [MongodbLibModule, UtilsModule, ExportLibModule],
  providers: [TemplateService, TemplateRepository, TemplateUploadService],
  exports: [TemplateService, TemplateUploadService],
})
export class TemplateLibModule {}
