import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { RegistrationService } from '../registration.service';
import { NoSessionException } from '../../../shared/exceptions/domain.exceptions';
import type { Registration } from '../registration.entity';

export interface RequestWithRegistration extends Request {
  registration?: Registration;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly registration: RegistrationService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithRegistration>();
    const token = req.cookies?.registration_session;
    if (!token) throw new NoSessionException();

    req.registration = await this.registration.findByResumeToken(token);
    return true;
  }
}