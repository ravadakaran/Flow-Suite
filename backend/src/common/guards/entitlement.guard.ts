import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/feature.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const featureKey = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!featureKey) return true;

    const req = ctx.switchToHttp().getRequest();
    const { tenantId, plan } = req.user;

    const entitlement = await this.prisma.planEntitlement.findUnique({
      where: { plan_featureKey: { plan, featureKey } },
    });

    if (!entitlement || !entitlement.isEnabled) {
      throw new ForbiddenException(
        `Feature '${featureKey}' is not available on the ${plan} plan`,
      );
    }

    if (entitlement.limitValue !== null) {
      const usage = await this.prisma.tenantUsage.findUnique({
        where: { tenantId },
      });

      const usageMap: Record<string, number> = {
        max_projects: usage?.projectCount ?? 0,
        max_members: usage?.memberCount ?? 0,
      };

      const current = usageMap[featureKey] ?? 0;
      if (current >= entitlement.limitValue) {
        throw new ForbiddenException(
          `Quota exceeded: ${featureKey} limit is ${entitlement.limitValue} on the ${plan} plan`,
        );
      }
    }

    return true;
  }
}
