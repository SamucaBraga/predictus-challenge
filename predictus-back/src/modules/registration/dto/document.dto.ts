import { IsEnum, IsString, ValidateIf } from 'class-validator';
import { DocumentType } from '../registration.entity';
import { IsCpf } from '../../../shared/decorators/is-cpf.decorator';
import { IsCnpj } from '../../../shared/decorators/is-cnpj.decorator';
 
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