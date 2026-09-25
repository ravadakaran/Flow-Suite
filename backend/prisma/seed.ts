import { PrismaClient, Plan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const entitlements = [
  { plan: Plan.free,       featureKey: 'max_projects', limitValue: 3,    isEnabled: true },
  { plan: Plan.free,       featureKey: 'max_members',  limitValue: 5,    isEnabled: true },
  { plan: Plan.free,       featureKey: 'audit_log',    limitValue: null, isEnabled: false },
  { plan: Plan.free,       featureKey: 'api_access',   limitValue: null, isEnabled: false },
  { plan: Plan.pro,        featureKey: 'max_projects', limitValue: 50,   isEnabled: true },
  { plan: Plan.pro,        featureKey: 'max_members',  limitValue: 25,   isEnabled: true },
  { plan: Plan.pro,        featureKey: 'audit_log',    limitValue: null, isEnabled: true },
  { plan: Plan.pro,        featureKey: 'api_access',   limitValue: null, isEnabled: true },
  { plan: Plan.enterprise, featureKey: 'max_projects', limitValue: null, isEnabled: true },
  { plan: Plan.enterprise, featureKey: 'max_members',  limitValue: null, isEnabled: true },
  { plan: Plan.enterprise, featureKey: 'audit_log',    limitValue: null, isEnabled: true },
  { plan: Plan.enterprise, featureKey: 'api_access',   limitValue: null, isEnabled: true },
];

async function main() {
  console.log('Seeding plan entitlements...');
  for (const e of entitlements) {
    await prisma.planEntitlement.upsert({
      where: { plan_featureKey: { plan: e.plan, featureKey: e.featureKey } },
      update: { limitValue: e.limitValue, isEnabled: e.isEnabled },
      create: e,
    });
  }

  console.log('Seeding test user and workspace...');

  // Create test user
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash,
      fullName: 'Test User',
    },
  });

  // Create test workspace (tenant)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'test-workspace' },
    update: {},
    create: {
      name: 'Test Workspace',
      slug: 'test-workspace',
      plan: Plan.free,
    },
  });

  // Ensure usage tracking exists for the tenant
  await prisma.tenantUsage.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      projectCount: 0,
      memberCount: 1,
      storageBytes: 0n,
    },
  });

  // Add user to workspace
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'owner',
      acceptedAt: new Date(),
    },
  });

  console.log('✅ Test user created:');
  console.log('   Email: test@example.com');
  console.log('   Password: password123');
  console.log('   Workspace: test-workspace');
  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
