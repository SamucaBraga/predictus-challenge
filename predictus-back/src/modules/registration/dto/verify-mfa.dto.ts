import { Matches } from 'class-validator';

export class VerifyMfaDto { 
  @Matches(/^\d{6}$/) code!: string; 
}