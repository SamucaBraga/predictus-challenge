import { ConfigService } from '@nestjs/config';
import { Body, Controller, Get, HttpCode, Post, Query, Res, UseGuards } from '@nestjs/common';
import { type Response } from 'express';
import { RegistrationService } from './registration.service';
import { MfaService } from '../mfa/mfa.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IdentificationDto } from './dto/identification.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';
import { SessionGuard } from './guards/session.guard';
import { CurrentRegistration } from './decorators/current-registration.decorator';
import { RegistrationStatus, type Registration } from './registration.entity';
import type { DocumentDto } from './dto/document.dto';
import type { ContactDto } from './dto/contact.dto';
import type { AddressDto } from './dto/address.dto';

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

  @UseGuards(SessionGuard)
  @Post('document')
  @HttpCode(200)
  async submitDocument(@CurrentRegistration() reg: Registration, @Body() dto: DocumentDto) {
    return this.registration.updateDocument(reg.id, dto);
  }

  @UseGuards(SessionGuard)
  @Post('contact')
  @HttpCode(200)
  async submitContact(@CurrentRegistration() reg: Registration, @Body() dto: ContactDto) {
    return this.registration.updateContact(reg.id, dto);
  }

  @UseGuards(SessionGuard)
  @Post('address')
  @HttpCode(200)
  async submitAddress(@CurrentRegistration() reg: Registration, @Body() dto: AddressDto) {
    return this.registration.updateAddress(reg.id, dto);
  }

  @UseGuards(SessionGuard)
  @Post('finish')
  @HttpCode(200)
  async finish(@CurrentRegistration() reg: Registration) {
    return this.registration.finish(reg.id);
  }

  @UseGuards(SessionGuard)
  @Get('state')
  async state(@CurrentRegistration() reg: Registration) {
    return this.registration.getState(reg.id);
  }

  @Get('resume')
  async resume(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    // SEM SessionGuard: este endpoint resolve o token via query (não cookie).
    // findByResumeToken lança ExpiredResumeTokenException(410)/InvalidResumeTokenException(404)
    // que o Route Handler do Next mapeia.
    const reg = await this.registration.findByResumeToken(token);
    if (reg.status === RegistrationStatus.FINISHED) {
      return { redirectTo: '/cadastro/sucesso' };
    }
    await this.registration.reactivateAbandoned(reg);
    this.setSessionCookie(res, reg.resume_token);
    return { redirectTo: this.routeForStep(reg.current_step) };
  }

  private routeForStep(step: number): string {
    const routes = [
      '/cadastro/identificacao', '/cadastro/verificar', '/cadastro/documento',
      '/cadastro/contato', '/cadastro/endereco', '/cadastro/revisao',
    ];
    return routes[Math.max(1, Math.min(step, routes.length - 1))];
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