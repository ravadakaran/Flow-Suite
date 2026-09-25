import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  fullName: string;

  @IsString()
  workspaceName: string;

  @IsString()
  workspaceSlug: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  tenantSlug: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}
