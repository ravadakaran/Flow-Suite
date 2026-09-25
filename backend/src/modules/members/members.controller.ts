import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './members.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { EntitlementGuard } from '../../common/guards/entitlement.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Feature } from '../../common/decorators/feature.decorator';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtGuard, RbacGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.membersService.listMembers(user.tenantId);
  }

  @Post('invite')
  @Roles('admin', 'owner')
  @UseGuards(EntitlementGuard)
  @Feature('max_members')
  invite(@CurrentUser() user: any, @Body() dto: InviteMemberDto) {
    return this.membersService.invite(user.tenantId, user.userId, dto);
  }

  @Post('invite/accept/:token')
  acceptInvite(@Param('token') token: string, @CurrentUser() user: any) {
    return this.membersService.acceptInvite(token, user.userId);
  }

  @Patch(':userId/role')
  @Roles('admin', 'owner')
  updateRole(
    @CurrentUser() user: any,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateRole(user.tenantId, targetUserId, dto, user.role);
  }

  @Delete(':userId')
  @Roles('admin', 'owner')
  remove(@CurrentUser() user: any, @Param('userId') targetUserId: string) {
    return this.membersService.removeMember(user.tenantId, targetUserId);
  }
}
