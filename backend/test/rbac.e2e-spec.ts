import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RbacGuard } from '../src/common/guards/rbac.guard';
import { Role } from '@prisma/client';

describe('Role-Based Access Control (RBAC) Guard (E2E / Integration)', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  const createMockContext = (userRole: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role: userRole },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RbacGuard, Reflector],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('1. Unrestricted Routes (No @Roles decorator)', () => {
    it('Allows any authenticated role when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const ctx = createMockContext('member');
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('2. Owner-Only Endpoints (@Roles("owner"))', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.owner]);
    });

    it('Allows Owner role (Hierarchy level 4)', () => {
      const ctx = createMockContext('owner');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('Blocks Admin role from Owner-only action (Throws ForbiddenException)', () => {
      const ctx = createMockContext('admin');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('Blocks Member role from Owner-only action (Throws ForbiddenException)', () => {
      const ctx = createMockContext('member');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('Blocks Guest role from Owner-only action (Throws ForbiddenException)', () => {
      const ctx = createMockContext('guest');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('3. Admin-Level Endpoints (@Roles("admin"))', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.admin]);
    });

    it('Allows Owner role to access Admin endpoints (Inherited hierarchy)', () => {
      const ctx = createMockContext('owner');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('Allows Admin role to access Admin endpoints', () => {
      const ctx = createMockContext('admin');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('Blocks Member role from Admin endpoints (Throws ForbiddenException)', () => {
      const ctx = createMockContext('member');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('4. Member-Level Endpoints (@Roles("member"))', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.member]);
    });

    it('Allows Owner, Admin, and Member roles', () => {
      expect(guard.canActivate(createMockContext('owner'))).toBe(true);
      expect(guard.canActivate(createMockContext('admin'))).toBe(true);
      expect(guard.canActivate(createMockContext('member'))).toBe(true);
    });

    it('Blocks Guest role from Member endpoints (Throws ForbiddenException)', () => {
      expect(() => guard.canActivate(createMockContext('guest'))).toThrow(ForbiddenException);
    });
  });

  describe('5. Malformed or Unknown Role', () => {
    it('Rejects undefined or unrecognized role string', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.member]);
      const ctx = createMockContext('anonymous_intruder');
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
