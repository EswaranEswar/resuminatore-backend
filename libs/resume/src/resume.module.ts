import { Module } from '@nestjs/common';
import { ResumeService } from './Resume.service';
import { ResumeRepository } from './resume.repository';
import { MongodbLibModule } from '@app/core';
import { UtilsModule } from '@app/utils';
import { UserLibModule } from '@app/user';
import { TemplateLibModule } from '@app/template';

@Module({
  imports: [MongodbLibModule, UtilsModule, UserLibModule, TemplateLibModule],
  providers: [ResumeService, ResumeRepository],
  exports: [ResumeService],
})
export class ResumeLibModule {}
