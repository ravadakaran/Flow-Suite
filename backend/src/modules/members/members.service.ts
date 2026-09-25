import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './members.dto';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async listMembers(tenantId: string) {
    return this.prisma.tenantMember.findMany({
      where: { tenantId },
      include: {
        user: { select: { id: true, email: true, fullName: true, avatarUrl: true } },
      },
    });
  }

  async invite(tenantId: string, inviterId: string, dto: InviteMemberDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      const alreadyMember = await this.prisma.tenantMember.findFirst({
        where: { tenantId, userId: existing.id },
      });
      if (alreadyMember) throw new ConflictException('User is already a member');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.invite.create({
      data: {
        tenantId,
        email: dto.email,
        role: dto.role,
        token,
        invitedBy: inviterId,
        expiresAt,
      },
    });

    // In production: queue email job via BullMQ here
    return { invite, inviteUrl: `/invite/accept?token=${token}` };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.acceptedAt) throw new ConflictException('Invite already accepted');
    if (invite.expiresAt < new Date()) throw new ForbiddenException('Invite has expired');

    await this.prisma.$transaction([
      this.prisma.tenantMember.create({
        data: {
          tenantId: invite.tenantId,
          userId,
          role: invite.role,
          invitedBy: invite.invitedBy,
          acceptedAt: new Date(),
        },
      }),
      this.prisma.invite.update({
        where: { token },
        data: { acceptedAt: new Date() },
      }),
      this.prisma.tenantUsage.update({
        where: { tenantId: invite.tenantId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return { message: 'Invite accepted', tenantId: invite.tenantId };
  }

  async updateRole(tenantId: string, targetUserId: string, dto: UpdateMemberRoleDto, actorRole: Role) {
    if (dto.role === 'owner') throw new ForbiddenException('Cannot assign owner role');

    const member = await this.prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner') throw new ForbiddenException('Cannot change owner role');

    return this.prisma.tenantMember.update({
      where: { tenantId_userId: { tenantId, userId: targetUserId } },
      data: { role: dto.role },
    });
  }

  async removeMember(tenantId: string, targetUserId: string) {
    const member = await this.prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'owner') throw new ForbiddenException('Cannot remove workspace owner');

    await this.prisma.$transaction([
      this.prisma.tenantMember.delete({
        where: { tenantId_userId: { tenantId, userId: targetUserId } },
      }),
      this.prisma.tenantUsage.update({
        where: { tenantId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Member removed' };
  }
}
