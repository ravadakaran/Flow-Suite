import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    // Skip middleware for auth and webhook routes
    const url = req.originalUrl || req.url || req.path;
    if (
      url.includes('/auth/') ||
      url.includes('/billing/webhook')
    ) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.slice(7);
    let payload: any;
    try {
      payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { sub: userId, tenantId } = payload;
    if (!tenantId) throw new UnauthorizedException('Token missing tenant context');

    const member = await this.prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      include: { tenant: true },
    });

    if (!member) throw new UnauthorizedException('User is not a member of this workspace');

    await this.prisma.setTenantContext(tenantId);

    (req as any).user = { userId, tenantId, role: member.role, plan: member.tenant.plan };

    next();
  }
}
