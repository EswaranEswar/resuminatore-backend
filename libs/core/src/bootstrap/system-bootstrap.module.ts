import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserLibModule } from '@app/user';

import { TemplateLibModule } from '@app/template';
import { SystemBootstrapService } from './system-bootstrap.service';

@Module({
  imports: [
    ConfigModule,
    UserLibModule,
    TemplateLibModule,
  ],
  providers: [SystemBootstrapService],
})
export class SystemBootstrapModule {}
