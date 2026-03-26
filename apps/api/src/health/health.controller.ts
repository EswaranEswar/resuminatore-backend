import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorator/public.decorator';

@Controller('health')
export class HealthController {

  @Public()
  @Get()
  liveness() {
    return { 
        status: 'ok',
        service: 'resuminatore-backend',
        timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  readiness() {
    return {    
        status: 'ready',
        service: 'resuminatore-backend',
        timestamp: new Date().toISOString(),
    };
  }
}
