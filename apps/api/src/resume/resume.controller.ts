import { ResumeService } from '@app/resume';
import {
  ResumeType,
  CreateResumeDto,
  UpdateResumeDto,
  ApplyTemplateDto,
} from '@app/shared';
import {
  Body,
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';

@Controller('resume')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get()
  async getAllResumeByUserId(): Promise<ResumeType[]> {
    return await this.resumeService.getAllResumeByUserId();
  }

  @Post()
  async createResume(
    @Body() resumeModel: CreateResumeDto,
  ): Promise<ResumeType> {
    const templateId = (resumeModel as any).templateId;
    return await this.resumeService.createResume(resumeModel, templateId);
  }

  @Patch(':id')
  async updateResume(
    @Param('id') id: string,
    @Body() resumeModel: UpdateResumeDto,
  ): Promise<ResumeType> {
    return await this.resumeService.updateResume(id, resumeModel);
  }

  @Get(':id')
  async getResumeById(@Param('id') id: string): Promise<ResumeType> {
    return await this.resumeService.getResumeById(id);
  }

  @Delete(':id') 
  async deleteResume(@Param('id') id: string): Promise<{ message: string }> {
    return await this.resumeService.deleteResume(id);
  }

  @Post('apply-template')
  async applyTemplate(@Body() dto: ApplyTemplateDto): Promise<ResumeType> {
    return await this.resumeService.applyTemplate(dto.templateId, dto.resumeId);
  }
}
