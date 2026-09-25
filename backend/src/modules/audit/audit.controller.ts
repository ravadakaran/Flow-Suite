import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { EntitlementGuard } from '../../common/guards/entitlement.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Feature } from '../../common/decorators/feature.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtGuard, RbacGuard, EntitlementGuard)
@Feature('audit_log')
@Roles('admin', 'owner')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getLogs(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.getLogs(
      user.tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
