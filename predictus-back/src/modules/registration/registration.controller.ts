import { ConfigService } from '@nestjs/config';
import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { type Response } from 'express';
import { RegistrationService } from './registration.service';
import { MfaService } from '../mfa/mfa.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IdentificationDto } from './dto/identification.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { SessionGuard } from './guards/session.guard';
import { CurrentRegistration } from './decorators/current-registration.decorator';
import type { Registration } from './registration.entity';

const COOKIE_NAME = 'registration_session';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Controller('registration')
export class RegistrationController {
  private readonly cookieMaxAgeMs: number;
  private readonly cookieSecure: boolean;

  constructor(
    private readonly registration: RegistrationService,
    private readonly mfa: MfaService,
    private readonly notifications: NotificationsService,
    config: ConfigService
  ) {
    this.cookieMaxAgeMs = config.get<number>('RESUME_TOKEN_TTL_DAYS')! * MS_PER_DAY;
    this.cookieSecure = config.get<string>('NODE_ENV') === 'production';
  }

  @Post('identification')
  @HttpCode(200)
  async identification(@Body() dto: IdentificationDto, @Res({ passthrough: true }) res: Response) {
    const reg = await this.registration.upsertIdentification(dto);
    const { plaintextCode } = await this.mfa.generate(reg.id);
    await this.notifications.sendMfaCode(reg.email, plaintextCode);
    this.setSessionCookie(res, reg.resume_token);
    return { requiresMfa: true };
  }

  @UseGuards(SessionGuard)
  @Post('mfa/verify')
  @HttpCode(200)
  async verifyMfa(@CurrentRegistration() reg: Registration, @Body() dto: VerifyMfaDto) {
    await this.mfa.validate(reg.id, dto.code);
    await this.registration.markMfaValidated(reg.id);
    return { success: true };
  }

  @UseGuards(SessionGuard)
  @Post('mfa/resend')
  @HttpCode(200)
  async resendMfa(@CurrentRegistration() reg: Registration) {
    const { plaintextCode } = await this.mfa.resend(reg.id);
    await this.notifications.sendMfaCode(reg.email, plaintextCode);
    return { sent: true };
  }

  private setSessionCookie(res: Response, value: string) {
    res.cookie(COOKIE_NAME, value, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: this.cookieMaxAgeMs,
      secure: this.cookieSecure, 
    });
  }
}