import { IsMobileBr } from "../../../shared/decorators/is-mobile-br.decorator";
export class ContactDto { 
  @IsMobileBr() phone!: string; 
}