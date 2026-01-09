import { Injectable, BadRequestException } from '@nestjs/common';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { TemplateRepository } from './template.repository';
import { MongoTemplate } from '@app/shared';
import { ExportService } from '@app/export';

@Injectable()
export class TemplateUploadService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly exportService: ExportService,
  ) {}

  async uploadTemplate(
    fileBuffer: Buffer,
    metadata: {
      name: string;
      category: string;
      thumbnailUrl?: string;
      previewUrl?: string;
    },
  ): Promise<MongoTemplate> {
    // 1. Extract ZIP
    const { html, css } = this.extractZip(fileBuffer);

    // 2. Extract placeholders
    const placeholders = this.extractPlaceholders(html);

    // 3. Generate Seed Data
    const seedData = this.generateSeedData(placeholders);

    // 4. Generate Assets (Thumbnails & Preview) if not provided
    let thumbUrl = metadata.thumbnailUrl;
    let previewUrl = metadata.previewUrl;

    if (!thumbUrl || !previewUrl) {
      const assets = await this.generateAssets(html, css, seedData);
      thumbUrl = thumbUrl || assets.thumbUrl;
      previewUrl = previewUrl || assets.previewUrl;
    }

    // 5. Default Styles (should be extracted or passed, but using defaults for now)
    const defaultStyles = {
      primaryColor: '#000000',
      secondaryColor: '#666666',
      accentColor: '#3b82f6',
      fontFamily: 'Arial, sans-serif',
      headingFont: 'Arial, sans-serif',
      layout: 'single-column',
      sidebarWidth: '30%',
      spacing: 'normal',
    };

    // 6. Save Template
    const templateData: any = {
      name: metadata.name,
      description: `Uploaded template ${metadata.name}`,
      category: metadata.category || 'modern',
      htmlStructure: html,
      cssStyles: css,
      sampleData: seedData,
      thumbnailUrl: thumbUrl,
      previewUrl: previewUrl,
      placeholders,
      isPremium: false,
      styles: defaultStyles,
    };

    return await this.templateRepository.create(templateData);
  }

  private extractZip(buffer: Buffer): { html: string; css: string } {
    try {
      const zip = new AdmZip(buffer);
      const zipEntries = zip.getEntries();

      let html = '';
      let css = '';

      zipEntries.forEach((entry) => {
        if (entry.entryName === 'index.html') {
          html = entry.getData().toString('utf8');
        } else if (entry.entryName === 'style.css') {
          css = entry.getData().toString('utf8');
        }
      });

      if (!html) {
        throw new BadRequestException('index.html not found in ZIP');
      }

      return { html, css };
    } catch (e) {
      throw new BadRequestException('Invalid ZIP file');
    }
  }

  private extractPlaceholders(html: string): string[] {
    // matches {{ variable }} or {{variable}}
    const matches = html.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    // remove duplicates and {{ }}
    return [...new Set(matches.map((m) => m.slice(2, -2).trim()))];
  }

  private generateSeedData(placeholders: string[]): any {
    const data: any = {};
    placeholders.forEach((pathStr) => {
      // Use a simple heuristic: if it looks like personalInfo.name, set 'Sample Name'
      // If it has array notation experience[0].title, handle it.
      this.setNested(data, pathStr, this.getDummyValue(pathStr));
    });
    return data;
  }

  private getDummyValue(key: string): string {
    const k = key.toLowerCase();
    if (k.includes('email')) return 'john.doe@example.com';
    if (k.includes('phone')) return '+1 234 567 8900';
    if (k.includes('name') && !k.includes('school') && !k.includes('company'))
      return 'John Doe';
    if (k.includes('summary'))
      return 'Passionate professional with 5+ years of experience in...';
    if (k.includes('title') || k.includes('position'))
      return 'Software Engineer';
    if (k.includes('company')) return 'Tech Corp';
    if (k.includes('school') || k.includes('university'))
      return 'University of Tech';
    if (k.includes('degree')) return 'B.Sc. Computer Science';
    if (k.includes('skill')) return 'JavaScript';
    return `Sample ${key.split('.').pop()}`;
  }

  private setNested(obj: any, path: string, value: any) {
    // Replace array notation [0] with .0
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    const keys = normalizedPath.split('.');

    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      const nextKey = keys[i + 1];
      const nextKeyIsNumber = !isNaN(Number(nextKey));

      if (!(key in current)) {
        current[key] = nextKeyIsNumber ? [] : {};
      }
      current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  private async generateAssets(
    html: string,
    css: string,
    seedData: any,
  ): Promise<{ thumbUrl: string; previewUrl: string }> {
    try {
      const renderedHtml = this.renderHtml(html, css, seedData);
      const imageBuffer = await this.exportService.generateImage(renderedHtml);

      // Save the generated image to public directory
      const assetId = uuidv4();
      const filename = `${assetId}.png`;
      const publicPath = path.join(
        process.cwd(),
        'apps/api/public/templates/thumbnails',
        filename,
      );

      // Ensure directory exists
      const dir = path.dirname(publicPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(publicPath, imageBuffer);

      return {
        thumbUrl: `/templates/thumbnails/${filename}`,
        previewUrl: `/templates/thumbnails/${filename}`,
      };
    } catch (error) {
      console.error('Failed to generate template assets via cloud:', error);
      return {
        thumbUrl: '/templates/thumbnails/default.png',
        previewUrl: '/templates/previews/default.png',
      };
    }
  }

  private renderHtml(html: string, css: string, data: any): string {
    // Basic substitution
    let content = html;
    // Replace {{ path }} with data value
    // We flatten data or just iterate regex matches again
    const matches = content.match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      matches.forEach((m) => {
        const key = m.slice(2, -2).trim();
        const value = this.getValueFromPath(data, key);
        content = content.replace(m, value || '');
      });
    }

    return `
      <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;
  }

  private getValueFromPath(obj: any, path: string): string {
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    const keys = normalizedPath.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null) return '';
      current = current[key];
    }
    return current;
  }
}
