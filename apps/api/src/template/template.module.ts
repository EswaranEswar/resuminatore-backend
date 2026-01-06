import { Module } from '@nestjs/common';
import { TemplateController } from './template.controller';
import { TemplateLibModule } from '@app/template';

@Module({
  imports: [TemplateLibModule],
  controllers: [TemplateController],
})
export class TemplateModule {}
