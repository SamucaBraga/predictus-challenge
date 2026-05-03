import { HttpException, HttpStatus } from '@nestjs/common';

export class RegistrationNotFoundException extends HttpException {
  constructor() { super({ error: 'registration_not_found' }, HttpStatus.NOT_FOUND); }
}

export class InvalidResumeTokenException extends HttpException {
  constructor() { super({ error: 'invalid_token' }, HttpStatus.NOT_FOUND); }
}

export class ExpiredResumeTokenException extends HttpException {
  constructor() { super({ error: 'expired_token' }, HttpStatus.GONE); }
}

export class StepNotAllowedException extends HttpException {
  constructor() { super({ error: 'step_not_allowed' }, HttpStatus.FORBIDDEN); }
}

export class MfaInvalidCodeException extends HttpException {
  constructor(public readonly attemptsLeft: number) {
    super({ error: 'invalid_code', attemptsLeft }, HttpStatus.BAD_REQUEST);
  }
}

export class MfaExpiredException extends HttpException {
  constructor() { super({ error: 'expired_code' }, HttpStatus.GONE); }
}

export class MfaTooManyAttemptsException extends HttpException {
  constructor() { super({ error: 'too_many_attempts' }, HttpStatus.TOO_MANY_REQUESTS); }
}

export class MfaNotValidatedException extends HttpException {
  constructor() { super({ error: 'mfa_not_validated' }, HttpStatus.FORBIDDEN); }
}

export class RegistrationAlreadyFinishedException extends HttpException {
  constructor() { super({ error: 'registration_already_finished' }, HttpStatus.BAD_REQUEST); }
}

export class IncompleteRegistrationDataException extends HttpException {
  constructor() { super({ error: 'incomplete_data' }, HttpStatus.BAD_REQUEST); }
}

export class NoSessionException extends HttpException {
  constructor() { super({ error: 'no_session' }, HttpStatus.UNAUTHORIZED); }
}

export class CepNotFoundException extends HttpException {
  constructor() { super({ error: 'cep_not_found' }, HttpStatus.NOT_FOUND); }
}