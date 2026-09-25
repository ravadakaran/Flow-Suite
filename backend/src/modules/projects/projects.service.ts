import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({ where: { id, tenantId } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(tenantId: string, userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: { ...dto, tenantId, createdBy: userId },
    });
    await this.prisma.tenantUsage.upsert({
      where: { tenantId },
      update: { projectCount: { increment: 1 } },
      create: {
        tenantId,
        projectCount: 1,
        memberCount: 1,
        storageBytes: 0n,
      },
    });
    return project;
  }

  async update(tenantId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(tenantId, id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.project.delete({ where: { id } });
    await this.prisma.tenantUsage.updateMany({
      where: { tenantId, projectCount: { gt: 0 } },
      data: { projectCount: { decrement: 1 } },
    });
    return { message: 'Project deleted' };
  }
}
