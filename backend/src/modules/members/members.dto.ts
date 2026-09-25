import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}

export class UpdateMemberRoleDto {
  @IsEnum(Role)
  role: Role;
}
