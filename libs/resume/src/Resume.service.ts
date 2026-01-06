import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ResumeRepository } from './resume.repository';
import { ClsService } from 'nestjs-cls';
import {
  ResumeSchema,
  ResumeType,
  CreateResumeSchema,
  CreateResumeDto,
  UpdateResumeSchema,
} from '@app/shared';
import { TemplateService } from '@app/template';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);
  constructor(
    private readonly resumeRepository: ResumeRepository,
    private readonly clsService: ClsService,
    private readonly templateService: TemplateService,
  ) {}

  get userSession() {
    return this.clsService.get('session')?.user;
  }

  get userId(): string {
    return this.userSession?.id;
  }

  async getAllResumes(): Promise<ResumeType[]> {
    const resumes = await this.resumeRepository.findAll();
    const parsedResult = ResumeSchema.array().safeParse(resumes);
    if (!parsedResult.success) {
      throw new Error(`Validation failed: ${parsedResult.error.message}`);
    }
    return parsedResult.data;
  }

  async getAllResumeByUserId(): Promise<ResumeType[]> {
    const resumes = await this.resumeRepository.findAll();

    const userRole = this.userSession?.role;
    const isAdmin = userRole === 'admin';

    const filtered = isAdmin
      ? resumes
      : resumes.filter((r) => r.userId === this.userId);

    const parseResult = ResumeSchema.array().safeParse(filtered);
    if (!parseResult.success) {
      throw new Error(`Validation failed: ${parseResult.error.message}`);
    }
    return parseResult.data;
  }
  async getResumeById(id: string): Promise<ResumeType> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new BadRequestException('Invalid resume ID');
    }

    const resume = await this.resumeRepository.findById(id);
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // 2. Security check
    const userRole = this.userSession?.role;
    const isOwner = resume.userId === this.userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to view this resume',
      );
    }

    const parsedResult = ResumeSchema.safeParse(resume);
    if (!parsedResult.success) {
      throw new Error(`Validation failed: ${parsedResult.error.message}`);
    }
    return parsedResult.data;
  }

  async createResume(
    resumeModel: Partial<CreateResumeDto>,
    templateId?: string,
  ): Promise<ResumeType> {
    const parseRequest = CreateResumeSchema.safeParse(resumeModel);
    if (!parseRequest.success) {
      throw new Error(`Validation failed: ${parseRequest.error.message}`);
    }

    const session = this.clsService.get('session');
    const user = session?.user;

    if (!user) {
      throw new Error(
        'User session not found. Please ensure you are logged in.',
      );
    }

    // Use title if provided, otherwise name, otherwise fallback to email
    const resumeName =
      parseRequest.data.title ||
      parseRequest.data.name ||
      user.email ||
      'Untitled Resume';

    let initialData: any = {
      ...parseRequest.data,
      name: resumeName,
      userId: user.id || this.userId,
    };

    if (templateId) {
      const template = await this.templateService.findById(templateId);
      if (template) {
        initialData = {
          ...initialData,
          templateId: template.id,
          appliedTemplate: {
            htmlStructure: template.htmlStructure,
            cssStyles: template.cssStyles,
            styles: template.styles,
          },
          // Merge sample data if resume is otherwise empty
          ...template.sampleData,
        };
      }
    }

    const newResume = await this.resumeRepository.create(initialData);

    const parseResult = ResumeSchema.safeParse(newResume);
    if (!parseResult.success) {
      throw new Error(`Output validation failed: ${parseResult.error.message}`);
    }

    return parseResult.data;
  }

  async updateResume(id: string, update: any): Promise<ResumeType> {
    // 1. Handle frontend potentially sending data wrapped in 'customData'
    let dataToParse = update;
    if (update.customData) {
      dataToParse = {
        ...update,
        ...update.customData,
      };
      delete dataToParse.customData;
    }

    const parseRequest = UpdateResumeSchema.safeParse(dataToParse);
    if (!parseRequest.success) {
      throw new BadRequestException(
        `Validation failed: ${parseRequest.error.message}`,
      );
    }

    // 2. Handle missing or invalid ID by creating a new resume (self-healing)
    if (!id || id === 'undefined' || id === 'null') {
      return this.createResume(parseRequest.data, parseRequest.data.templateId);
    }

    const resume = await this.resumeRepository.findById(id);
    if (!resume) {
      this.logger.warn(
        `Resume with ID ${id} not found. Falling back to creating a new one.`,
      );
      return this.createResume(parseRequest.data, parseRequest.data.templateId);
    }

    // 3. Security check: User must own the resume OR be an admin in the same org
    const userRole = this.userSession?.role;
    const isOwner = resume.userId === this.userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to update this resume',
      );
    }

    // 4. Update the resume
    const updated = await this.resumeRepository.update(id, parseRequest.data);

    if (!updated) {
      throw new Error('Failed to update resume');
    }

    const parsedResult = ResumeSchema.safeParse(updated);
    if (!parsedResult.success) {
      throw new Error(
        `Output validation failed: ${parsedResult.error.message}`,
      );
    }
    return parsedResult.data;
  }

  async deleteResume(id: string): Promise<{ message: string }> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new BadRequestException('Invalid resume ID');
    }

    // 1. Find resume by ID
    const resume = await this.resumeRepository.findById(id);
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // 2. Security check
    const userRole = this.userSession?.role;
    const isOwner = resume.userId === this.userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to delete this resume',
      );
    }

    const deleted = await this.resumeRepository.deleteById(id);

    if (!deleted) {
      throw new Error('Failed to delete resume');
    }

    return { message: 'Resume deleted successfully' };
  }

  async applyTemplate(
    templateId: string,
    resumeId?: string,
  ): Promise<ResumeType> {
    if (!resumeId || resumeId === 'undefined' || resumeId === 'null') {
      // If no valid resumeId, creating a new resume with this template
      return this.createResume({}, templateId);
    }

    const template = await this.templateService.findById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const resume = await this.resumeRepository.findById(resumeId);
    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    // 2. Security check
    const userRole = this.userSession?.role;
    const isOwner = resume.userId === this.userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Access denied: You do not have permission to modify this resume',
      );
    }

    // 3. Perform deep copy of template structure into resume
    const updated = await this.resumeRepository.update(resumeId, {
      templateId: template.id,
      appliedTemplate: {
        htmlStructure: template.htmlStructure,
        cssStyles: template.cssStyles,
        styles: template.styles,
      },
      // If resume is empty, maybe merge sample data
      ...(Object.keys(resume.personalInfo || {}).length === 0
        ? template.sampleData
        : {}),
    });

    const parsedResult = ResumeSchema.safeParse(updated);
    if (!parsedResult.success) {
      throw new Error(`Validation failed: ${parsedResult.error.message}`);
    }
    return parsedResult.data;
  }
}
