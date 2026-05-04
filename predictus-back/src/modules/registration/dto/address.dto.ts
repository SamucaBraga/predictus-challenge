import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class AddressDto {
  @Matches(/^\d{8}$/) cep!: string;
  @IsString() @IsNotEmpty() street!: string;
  @IsString() @IsNotEmpty() number!: string;
  @IsOptional() @IsString() complement?: string;
  @IsString() @IsNotEmpty() neighborhood!: string;
  @IsString() @IsNotEmpty() city!: string;
  @IsString() @Length(2, 2) state!: string;
}