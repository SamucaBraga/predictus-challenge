import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class IdentificationDto {
  @IsString() @MinLength(2) @MaxLength(255)
  name!: string;

  @IsEmail() @MaxLength(255)
  email!: string;
}