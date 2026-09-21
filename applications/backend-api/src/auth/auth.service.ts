import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { validateEmailFormat } from './emailValidation';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, turnstileToken } = dto;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Use the strict domain/username validation from Art Diaries
    const emailCheck = validateEmailFormat(normalizedEmail);
    if (!emailCheck.isValid) {
      throw new BadRequestException(emailCheck.error);
    }

    // Cloudflare Turnstile Bot Protection Verification
    const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "1x000000000000000000000000000000AA";
    try {
      const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      });
      const turnstileResult = await turnstileRes.json();
      console.log('Turnstile Validation Result:', turnstileResult);
      console.log('Using Secret Key (first 10 chars):', TURNSTILE_SECRET_KEY.substring(0, 10));
      
      if (!turnstileResult.success && TURNSTILE_SECRET_KEY !== "1x000000000000000000000000000000AA") {
        console.error('Turnstile verification failed!', turnstileResult['error-codes']);
        throw new BadRequestException("Bot protection verification failed. Please try again.");
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException("Failed to verify bot protection.");
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Never return password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
