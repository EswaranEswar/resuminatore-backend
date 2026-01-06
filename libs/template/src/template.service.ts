import { Injectable, NotFoundException } from '@nestjs/common';
import { MongoTemplate } from '@app/shared';
import { TemplateRepository } from './template.repository';

import { INITIAL_TEMPLATES } from './template.seed';

@Injectable()
export class TemplateService {
  constructor(private readonly templateRepository: TemplateRepository) {}

  async findAll(): Promise<MongoTemplate[]> {
    return this.templateRepository.findAll();
  }

  async findById(id: string): Promise<MongoTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }
    return template;
  }

  async findByCategory(category: string): Promise<MongoTemplate[]> {
    return this.templateRepository.findByCategory(category);
  }

  async create(data: any): Promise<MongoTemplate> {
    return this.templateRepository.create(data);
  }

  async update(id: string, data: any): Promise<MongoTemplate | null> {
    return this.templateRepository.update(id, data);
  }

  async delete(id: string): Promise<MongoTemplate | null> {
    return this.templateRepository.deleteById(id);
  }

  // Logic to get metadata for gallery
  async getGallery(): Promise<Partial<MongoTemplate>[]> {
    const templates = await this.findAll();
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      thumbnailUrl: t.thumbnailUrl,
      isPremium: t.isPremium,
    }));
  }

  // Seeder to populate the database initially
  async seedTemplates(): Promise<void> {
    const existing = await this.templateRepository.findAll();
    if (existing.length > 0) return;

    for (const t of INITIAL_TEMPLATES) {
      await this.create(t);
    }
  }
  // Render template to HTML for thumbnail generation
  async renderTemplate(id: string): Promise<string> {
    const template = await this.findById(id);
    const { personalInfo, experience, education, skills, languages } =
      template.sampleData || {};
    const { styles } = template;

    // Using the logic we previously had:
    const sidebarContent = `
      <div class="sidebar" style="width: ${styles.sidebarWidth}; background: ${styles.primaryColor}; color: white; padding: 2rem; min-height: 1040px;">
        <h1 style="font-family: ${styles.headingFont}; font-size: 24pt; font-weight: bold; margin-bottom: 0.5rem; line-height: 1.2;">${personalInfo?.name || 'Your Name'}</h1>
        <p style="font-size: 13pt; opacity: 0.9; margin-bottom: 2rem;">${personalInfo?.role || 'Professional Role'}</p>
        
        <div class="contact-info" style="margin-bottom: 2rem;">
          <h3 style="font-family: ${styles.headingFont}; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 0.5rem; margin-bottom: 1rem; font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Contact</h3>
          <p style="margin-bottom: 0.5rem; font-size: 11pt;">${personalInfo?.email || 'email@example.com'}</p>
          <p style="margin-bottom: 0.5rem; font-size: 11pt;">${personalInfo?.phone || '+1 234 567 890'}</p>
          <p style="margin-bottom: 0.5rem; font-size: 11pt;">${personalInfo?.location || 'City, Country'}</p>
        </div>

        <div class="skills">
          <h3 style="font-family: ${styles.headingFont}; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 0.5rem; margin-bottom: 1rem; font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Skills</h3>
          <ul style="padding-left: 1.2rem; margin: 0;">
            ${(skills || [{ name: 'Skill 1' }, { name: 'Skill 2' }]).map((s) => `<li style="margin-bottom: 0.5rem; font-size: 11pt;">${s.name}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    const mainContent = `
      <div class="main-content" style="flex: 1; padding: 3rem; background: white;">
        <section style="margin-bottom: 2.5rem;">
          <h3 style="font-family: ${styles.headingFont}; font-size: 16pt; font-weight: bold; color: ${styles.primaryColor}; border-bottom: 2px solid ${styles.accentColor}; padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">Professional Summary</h3>
          <p style="line-height: 1.6; color: #4b5563; font-size: 11pt;">${personalInfo?.summary || 'Professional summary goes here...'}</p>
        </section>

        <section style="margin-bottom: 2.5rem;">
          <h3 style="font-family: ${styles.headingFont}; font-size: 16pt; font-weight: bold; color: ${styles.primaryColor}; border-bottom: 2px solid ${styles.accentColor}; padding-bottom: 0.5rem; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px;">Experience</h3>
          ${(
            experience || [
              {
                position: 'Job Title',
                company: 'Company Name',
                startDate: '2020',
                currentlyWorking: true,
                location: 'City',
                description: 'Job description...',
              },
            ]
          )
            .map(
              (e) => `
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">
                <h4 style="font-size: 14pt; font-weight: bold; color: #111827; margin: 0;">${e.position}</h4>
                <span style="font-size: 10pt; color: #6b7280;">${e.startDate} — ${e.currentlyWorking ? 'Present' : e.endDate}</span>
              </div>
              <div style="color: ${styles.secondaryColor}; font-weight: 500; margin-bottom: 0.5rem; font-size: 11pt;">${e.company} | ${e.location}</div>
              <p style="font-size: 11pt; line-height: 1.5; color: #4b5563; white-space: pre-line;">${e.description}</p>
            </div>
          `,
            )
            .join('')}
        </section>
      </div>
    `;

    const layoutStyle =
      styles.layout === 'sidebar-left'
        ? 'flex-direction: row;'
        : styles.layout === 'sidebar-right'
          ? 'flex-direction: row-reverse;'
          : 'flex-direction: column;';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;700&family=Lora&family=Playfair+Display:wght@700&family=Poppins:wght@400;600&family=Space+Grotesk:wght@700&family=JetBrains+Mono&family=IBM+Plex+Sans:wght@400;600&family=Crimson+Text&family=Cormorant+Garamond:wght@700&family=Open+Sans:wght@400;700&family=Roboto:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            font-family: ${styles.fontFamily}; 
            color: #374151; 
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        <div class="resume-container" style="display: flex; ${layoutStyle} min-height: 297mm; width: 210mm; background: white; overflow: hidden; box-shadow: none;">
          ${styles.layout.includes('sidebar') ? sidebarContent + mainContent : mainContent}
        </div>
      </body>
      </html>
    `;
  }
}
