import { ExportService } from '@app/export';
import { Controller, Post, Res, Body } from '@nestjs/common';
import { Response } from 'express';

@Controller('resume/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('pdf')
  async exportPdf(@Res() res: Response, @Body('html') html: string) {
    // Generate PDF via the cloud-based ExportService
    const pdf = await this.exportService.generatePdf(html);

    // Set headers and send the file
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=resume.pdf',
    });

    return res.send(pdf);
  }

  @Post('word')
  async exportWord(@Res() res: Response, @Body('html') html: string) {
    // Generate Word doc via the ExportService
    const doc = await this.exportService.generateWord(html);

    // Set headers and send the file
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename=resume.docx',
    });

    return res.send(doc);
  }
}
