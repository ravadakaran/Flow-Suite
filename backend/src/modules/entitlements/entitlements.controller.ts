import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EntitlementsService } from './entitlements.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Entitlements')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('entitlements')
export class EntitlementsController {
  constructor(private readonly entitlementsService: EntitlementsService) {}

  @Get()
  getMyEntitlements(@CurrentUser() user: any) {
    return this.entitlementsService.getEntitlements(user.plan);
  }

  @Get('usage')
  getUsage(@CurrentUser() user: any) {
    return this.entitlementsService.getUsage(user.tenantId);
  }
}
