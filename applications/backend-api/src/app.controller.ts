import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return {
      success: true,
      message: 'Veyra Backend API is running successfully!',
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
