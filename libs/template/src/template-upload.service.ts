import { Injectable, BadRequestException } from '@nestjs/common';
import * as AdmZip from 'adm-zip';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { TemplateRepository } from './template.repository';
import { MongoTemplate } from '@app/shared';

@Injectable()
export class TemplateUploadService {
  constructor(private readonly templateRepository: TemplateRepository) {}

  async uploadTemplate(
    fileBuffer: Buffer,
    metadata: { name: string; category: string },
  ): Promise<MongoTemplate> {
    // 1. Extract ZIP
    const { html, css } = this.extractZip(fileBuffer);

    // 2. Extract placeholders
    const placeholders = this.extractPlaceholders(html);

    // 3. Generate Seed Data
    const seedData = this.generateSeedData(placeholders);

    // 4. Generate Assets (Thumbnails & Preview)
    const assets = await this.generateAssets(html, css, seedData);

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
      thumbnailUrl: assets.thumbUrl,
      previewUrl: assets.previewUrl,
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
    const renderedHtml = this.renderHtml(html, css, seedData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 1040 });
      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Ensure directories exist
      const publicDir = path.join(process.cwd(), 'apps/api/public/templates');
      const thumbsDir = path.join(publicDir, 'thumbnails');
      const previewsDir = path.join(publicDir, 'previews');

      if (!fs.existsSync(thumbsDir))
        fs.mkdirSync(thumbsDir, { recursive: true });
      if (!fs.existsSync(previewsDir))
        fs.mkdirSync(previewsDir, { recursive: true });

      const assetId = uuidv4();
      const thumbFilename = `${assetId}-thumb.png`;
      const previewFilename = `${assetId}-preview.png`;

      // Thumbnail (smaller)
      // Actually we can just resize or take screenshot. For now taking full page as thumb but smaller?
      // Usually thumb is smaller viewport or resized. Let's keep one size for now as per current system, just simplified.
      await page.screenshot({ path: path.join(thumbsDir, thumbFilename) });

      // Preview (maybe larger or same)
      await page.screenshot({ path: path.join(previewsDir, previewFilename) });

      return {
        thumbUrl: `/templates/thumbnails/${thumbFilename}`,
        previewUrl: `/templates/previews/${previewFilename}`,
      };
    } finally {
      await browser.close();
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
