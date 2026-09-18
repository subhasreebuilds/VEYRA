import { NestFactory } from '@nestjs/core';
// Force Vercel rebuild to include vercel.json changes
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
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

  const port = Number(configService.get('PORT')) || Number(process.env.PORT) || 5001;
  const server = await app.listen(port);
  
  // Increase timeouts for long-running AI requests (Gemini can take 30-60s)
  server.setTimeout(120000); // 2 minutes
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;
  
  console.log(`[NestApplication] Veyra Backend listening on port ${port}`);
}
bootstrap();
