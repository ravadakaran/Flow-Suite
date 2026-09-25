import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('Email already registered');

    const existingTenant = await this.prisma.tenant.findUnique({ where: { slug: dto.workspaceSlug } });
    if (existingTenant) throw new ConflictException('Workspace slug already taken');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, fullName: dto.fullName },
    });

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.workspaceName,
        slug: dto.workspaceSlug,
        usage: { create: {} },
      },
    });

    await this.prisma.tenantMember.create({
      data: { tenantId: tenant.id, userId: user.id, role: 'owner', acceptedAt: new Date() },
    });

    await this.prisma.tenantUsage.update({
      where: { tenantId: tenant.id },
      data: { memberCount: { increment: 1 } },
    });

    return this.issueTokens(user.id, tenant.id);
  }

  async login(dto: LoginDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } });
    if (!tenant) throw new NotFoundException('Workspace not found');

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const member = await this.prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    });
    if (!member) throw new UnauthorizedException('Not a member of this workspace');

    return this.issueTokens(user.id, tenant.id);
  }

  async refresh(token: string) {
    try {
      // Verify the token signature and get the payload
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as { sub: string; tenantId: string };

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.refreshToken) throw new UnauthorizedException('Invalid refresh token');

      // Verify the token hash matches the stored hash
      const valid = await bcrypt.compare(token, user.refreshToken);
      if (!valid) throw new UnauthorizedException('Invalid refresh token');

      return this.issueTokens(payload.sub, payload.tenantId);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async issueTokens(userId: string, tenantId: string) {
    const member = await this.prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const payload = {
      sub: userId,
      userId,
      tenantId,
      role: member?.role ?? 'owner',
      plan: tenant?.plan ?? 'free',
    };

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });

    return { accessToken, refreshToken };
  }
}
