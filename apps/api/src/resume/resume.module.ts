import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeLibModule } from '@app/resume';

@Module({
  imports: [ResumeLibModule],
  controllers: [ResumeController],
})
export class ResumeModule {}
