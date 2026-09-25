import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Plan } from '@prisma/client';

@Injectable()
export class EntitlementsService {
  constructor(private prisma: PrismaService) {}

  async getEntitlements(plan: Plan) {
    return this.prisma.planEntitlement.findMany({ where: { plan } });
  }

  async checkFeature(plan: Plan, featureKey: string): Promise<boolean> {
    const e = await this.prisma.planEntitlement.findUnique({
      where: { plan_featureKey: { plan, featureKey } },
    });
    return e?.isEnabled ?? false;
  }

  async getUsage(tenantId: string) {
    const [tenant, entitlements] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { usage: true },
      }),
      this.prisma.planEntitlement.findMany(),
    ]);

    const plan = tenant?.plan || Plan.free;
    const usage = tenant?.usage;

    const seatLimitEnt = entitlements.find((e) => e.plan === plan && e.featureKey === 'max_members');
    const projectLimitEnt = entitlements.find((e) => e.plan === plan && e.featureKey === 'max_projects');

    const seatsLimit = seatLimitEnt?.limitValue ?? (plan === Plan.free ? 3 : plan === Plan.pro ? 10 : 50);
    const projectsLimit = projectLimitEnt?.limitValue ?? (plan === Plan.free ? 2 : plan === Plan.pro ? 20 : 999999);

    return {
      currentPlan: plan,
      subscriptionStatus: tenant?.subscriptionStatus || 'active',
      seatsUsed: usage?.memberCount ?? 1,
      seatsLimit,
      projectsUsed: usage?.projectCount ?? 0,
      projectsLimit,
      storageUsed: 1,
      storageLimit: plan === Plan.free ? 1 : plan === Plan.pro ? 50 : 500,
    };
  }
}
