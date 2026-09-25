import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsOptional, IsString } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() avatarUrl?: string;
}

class ChangePasswordDto {
  @IsOptional() @IsString() currentPassword?: string;
  @IsString() newPassword!: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    const userId = user.userId || user.sub;
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('profile')
  updateProfileAlias(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    const userId = user.userId || user.sub;
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    const userId = user.userId || user.sub;
    return this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }
}
