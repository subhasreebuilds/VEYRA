import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as cookieParser from 'cookie-parser';

let cachedApp: any = null;

export default async (req: any, res: any) => {
  if (!cachedApp) {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.use(cookieParser());

    await app.init();
    cachedApp = app;
  }
  
  const instance = cachedApp.getHttpAdapter().getInstance();
  return instance(req, res);
};
