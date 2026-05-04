import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { IsCpf } from '../../../shared/validators/decorators/is-cpf.decorator';
import { IsCnpj } from '../../../shared/validators/decorators/is-cnpj.decorator';
import { DocumentType } from '../registration.entity';
 
export class DocumentDto {
  @IsEnum(DocumentType)
  document_type!: DocumentType;

  @IsString()
  @ValidateIf((o) => o.document_type === DocumentType.CPF)
  @IsCpf()
  @ValidateIf((o) => o.document_type === DocumentType.CNPJ)
  @IsCnpj()
  document_number!: string;
}