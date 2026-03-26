import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TemplateService, TemplateUploadService } from '@app/template';
import { CreateTemplateDto, UpdateTemplateDto } from '@app/shared';
import { Express } from 'express';
import { Public } from '../auth/decorator/public.decorator';

@Controller('templates')
export class TemplateController {
  constructor(
    private readonly templateService: TemplateService,
    private readonly templateUploadService: TemplateUploadService,
  ) {}

  @Public()
  @Get()
  async getGallery() {
    return await this.templateService.getGallery();
  }

  @Public()
  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    return await this.templateService.findById(id);
  }

  @Post()
  async create(@Body() data: CreateTemplateDto) {
    return await this.templateService.create(data);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name: string,
    @Body('category') category: string,
    @Body('thumbnailUrl') thumbnailUrl?: string,
    @Body('previewUrl') previewUrl?: string,
  ) {
    return await this.templateUploadService.uploadTemplate(file.buffer, {
      name,
      category,
      thumbnailUrl,
      previewUrl,
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateTemplateDto) {
    return await this.templateService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.templateService.delete(id);
  }

  @Post('seed')
  async seed() {
    await this.templateService.seedTemplates();
    return { message: 'Templates seeded successfully' };
  }

  @Public()
  @Get('render/:id')
  async render(@Param('id') id: string) {
    return await this.templateService.renderTemplate(id);
  }
}
