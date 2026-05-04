import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithRegistration } from '../guards/session.guard';
import type { Registration } from '../registration.entity';

export const CurrentRegistration = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Registration => {
    const req = ctx.switchToHttp().getRequest<RequestWithRegistration>();
    if (!req.registration) {
      throw new Error('CurrentRegistration without SessionGuard. Add @UseGuards(SessionGuard).');
    }
    return req.registration;
  },
);