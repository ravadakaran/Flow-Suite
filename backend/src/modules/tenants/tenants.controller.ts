import { Controller, Get, Patch, Delete, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './tenants.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtGuard, RbacGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getMyTenant(@CurrentUser() user: any) {
    return this.tenantsService.findById(user.tenantId);
  }

  @Patch('me')
  @Roles('admin', 'owner')
  updateTenant(@CurrentUser() user: any, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user.tenantId, dto);
  }

  @Patch(':id')
  @Roles('admin', 'owner')
  updateTenantById(@CurrentUser() user: any, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('owner')
  deleteTenant(@CurrentUser() user: any) {
    return this.tenantsService.remove(user.tenantId);
  }

  @Post(':id/leave')
  leaveTenant(@CurrentUser() user: any) {
    const userId = user.sub || user.userId || user.id;
    return this.tenantsService.leave(user.tenantId, userId);
  }
}
