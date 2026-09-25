import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['active', 'inactive', 'archived'])
  @IsOptional()
  status?: string = 'active';
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['active', 'inactive', 'archived'])
  @IsOptional()
  status?: string;
}
