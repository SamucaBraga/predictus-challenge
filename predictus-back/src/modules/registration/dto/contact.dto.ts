import { IsMobileBr } from '../../../shared/validators/decorators/is-mobile-br.decorator';

export class ContactDto { 
  @IsMobileBr() phone!: string; 
}