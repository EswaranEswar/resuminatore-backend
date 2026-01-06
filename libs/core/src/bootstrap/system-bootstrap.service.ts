import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '@app/user';
import { TemplateService } from '@app/template';

@Injectable()
export class SystemBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(SystemBootstrapService.name);

  constructor(
    private readonly userService: UserService,
    private readonly templateService: TemplateService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      this.logger.warn(
        'ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping system bootstrap.',
      );
      return;
    }

    // 1. Check if admin user exists
    let adminUser = await this.userService.findByEmail(adminEmail);
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      // Create admin with only essential fields
      adminUser = await this.userService.createUser({
        email: adminEmail,
        name: 'System Admin',
        password: hashedPassword,
        role: 'admin',
        isVerified: true,
      });
      this.logger.log(`System admin created: ${adminEmail}`);
    }

    // 2. Seed Templates
    await this.templateService.seedTemplates();
    this.logger.log('Templates seeded (if not already present)');
  }
}
