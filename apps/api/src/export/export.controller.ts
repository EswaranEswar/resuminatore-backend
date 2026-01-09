import { ExportService } from '@app/export';
import {
  Controller,
  Post,
  Body,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../auth/decorator/public-decorator';
import { SkipCsrf } from '../auth/decorator/csrf.decorator';

@SkipCsrf()
@Controller('resume/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Public()
  @Post('pdf')
  async exportPdf(
    @Body('html') html: string,
    @Body('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      if (!html) {
        throw new HttpException(
          'HTML content is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const pdfBuffer = await this.exportService.generatePdf(html);

      const safeFilename = (filename || 'resume')
        .replace(/[^a-z0-9_-]/gi, '_')
        .substring(0, 100);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });

      return res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF export error:', error);
      throw new HttpException(
        `PDF generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('word')
  async exportWord(
    @Body('html') html: string,
    @Body('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      if (!html) {
        throw new HttpException(
          'HTML content is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const docxBuffer = await this.exportService.generateWord(html);

      const safeFilename = (filename || 'resume')
        .replace(/[^a-z0-9_-]/gi, '_')
        .substring(0, 100);

      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFilename}.docx"`,
        'Content-Length': docxBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      });

      return res.send(docxBuffer);
    } catch (error) {
      console.error('Word export error:', error);
      throw new HttpException(
        `Word generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
