import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditPayload {
  tenantId: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('audit') private auditQueue: Queue,
  ) {}

  async log(payload: AuditPayload) {
    await this.auditQueue.add('write', payload, { attempts: 3, backoff: 2000 });
  }

  async writeLog(payload: AuditPayload) {
    await this.prisma.auditLog.create({ data: payload });
  }

  async getLogs(tenantId: string, page = 1, limit = 50) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { actor: { select: { fullName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where: { tenantId } }),
    ]);
    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
}
