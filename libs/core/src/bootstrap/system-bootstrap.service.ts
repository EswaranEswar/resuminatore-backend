import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

    if (!adminEmail) {
      this.logger.warn('ADMIN_EMAIL not set. Skipping system admin bootstrap.');
    } else {
      let adminUser = await this.userService.findByEmail(adminEmail);
      if (!adminUser) {
        adminUser = await this.userService.createUser({
          email: adminEmail,
          name: 'System Admin',
          role: 'admin',
          isVerified: true,
        });
        this.logger.log(`System admin profile created: ${adminEmail}`);

        await this.userService.updateUserByEmail(adminEmail, {
          createdBy: adminUser.id,
          updatedBy: adminUser.id,
        });
      }
    }

    // 2. Seed Templates
    await this.templateService.seedTemplates();
    this.logger.log('Templates seeded (if not already present)');
  }
}
