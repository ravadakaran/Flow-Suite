import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, projectId?: string) {
    return this.prisma.task.findMany({
      where: { tenantId, ...(projectId ? { projectId } : {}) },
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(tenantId: string, userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status ?? 'todo',
        priority: dto.priority ?? 'medium',
        assigneeId: dto.assigneeId || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        tenantId,
        projectId: dto.projectId,
        createdBy: userId,
      },
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(tenantId, id);
    const data: any = { ...dto };
    if ('dueDate' in dto) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if ('assigneeId' in dto) {
      data.assigneeId = dto.assigneeId || null;
    }
    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.task.delete({ where: { id } });
    return { message: 'Task deleted' };
  }
}
