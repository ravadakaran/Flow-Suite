import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface NotificationItem {
  id: string;
  type: 'task' | 'team' | 'project' | 'security' | 'system';
  title: string;
  message: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

@Injectable()
export class NotificationsService {
  // In-memory set of read notification IDs keyed by userId
  private userReadNotifications = new Map<string, Set<string>>();

  constructor(private prisma: PrismaService) {}

  private getReadSet(userId: string): Set<string> {
    if (!this.userReadNotifications.has(userId)) {
      this.userReadNotifications.set(userId, new Set<string>());
    }
    return this.userReadNotifications.get(userId)!;
  }

  async getNotifications(tenantId: string, userId: string): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    const readSet = this.getReadSet(userId);

    // 1. Fetch recent tasks in this tenant
    const tasks = await this.prisma.task.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        project: { select: { name: true } },
        creator: { select: { fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true } },
      },
    });

    // 2. Fetch recent audit logs in this tenant
    const auditLogs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        actor: { select: { fullName: true, email: true } },
      },
    });

    const items: NotificationItem[] = [];

    // Synthesize task notifications
    for (const task of tasks) {
      const isAssignedToMe = task.assigneeId === userId;
      const creatorName = task.creator?.fullName || task.creator?.email || 'A team member';

      if (isAssignedToMe) {
        items.push({
          id: `task-assigned-${task.id}`,
          type: 'task',
          title: 'Task Assigned to You',
          message: `${creatorName} assigned you to "${task.title}" in ${task.project?.name || 'project'}.`,
          link: '/dashboard/tasks',
          createdAt: task.createdAt.toISOString(),
          read: readSet.has(`task-assigned-${task.id}`),
        });
      } else {
        items.push({
          id: `task-created-${task.id}`,
          type: 'task',
          title: 'New Task Created',
          message: `"${task.title}" was created in ${task.project?.name || 'workspace'}.`,
          link: '/dashboard/tasks',
          createdAt: task.createdAt.toISOString(),
          read: readSet.has(`task-created-${task.id}`),
        });
      }
    }

    // Synthesize audit log notifications
    for (const log of auditLogs) {
      const actorName = log.actor?.fullName || log.actorEmail || 'Workspace Admin';
      const action = log.action.toUpperCase();

      if (action.includes('INVITE') || action.includes('MEMBER')) {
        items.push({
          id: `audit-${log.id}`,
          type: 'team',
          title: 'Team Update',
          message: `${actorName} performed: ${log.action.replace(/_/g, ' ').toLowerCase()}.`,
          link: '/dashboard/team',
          createdAt: log.createdAt.toISOString(),
          read: readSet.has(`audit-${log.id}`),
        });
      } else if (action.includes('PROJECT')) {
        items.push({
          id: `audit-${log.id}`,
          type: 'project',
          title: 'Project Update',
          message: `Project activity: ${log.action.replace(/_/g, ' ').toLowerCase()}.`,
          link: '/dashboard/projects',
          createdAt: log.createdAt.toISOString(),
          read: readSet.has(`audit-${log.id}`),
        });
      } else if (action.includes('PLAN') || action.includes('BILLING')) {
        items.push({
          id: `audit-${log.id}`,
          type: 'security',
          title: 'Subscription Event',
          message: `Billing/Plan activity recorded in workspace.`,
          link: '/dashboard/billing',
          createdAt: log.createdAt.toISOString(),
          read: readSet.has(`audit-${log.id}`),
        });
      }
    }

    // System welcome notification
    const welcomeId = `system-welcome-${tenantId}`;
    items.push({
      id: welcomeId,
      type: 'system',
      title: 'Welcome to FlowSuite',
      message: 'Your workspace is active and ready for collaboration.',
      link: '/dashboard',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: readSet.has(welcomeId),
    });

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Deduplicate by ID
    const uniqueMap = new Map<string, NotificationItem>();
    for (const item of items) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    const finalItems = Array.from(uniqueMap.values()).slice(0, 15);
    const unreadCount = finalItems.filter((i) => !i.read).length;

    return {
      notifications: finalItems,
      unreadCount,
    };
  }

  markAllRead(userId: string, ids: string[]): { success: boolean } {
    const readSet = this.getReadSet(userId);
    for (const id of ids) {
      readSet.add(id);
    }
    return { success: true };
  }

  markRead(userId: string, id: string): { success: boolean } {
    const readSet = this.getReadSet(userId);
    readSet.add(id);
    return { success: true };
  }
}
