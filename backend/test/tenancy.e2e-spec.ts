import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectsService } from '../src/modules/projects/projects.service';
import { CustomersService } from '../src/modules/customers/customers.service';
import { TasksService } from '../src/modules/tasks/tasks.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Multi-Tenant Data Isolation (E2E / Integration)', () => {
  let projectsService: ProjectsService;
  let customersService: CustomersService;
  let tasksService: TasksService;

  const TENANT_A = 'tenant-aaa-1111';
  const TENANT_B = 'tenant-bbb-2222';
  const USER_A = 'user-aaa';
  const USER_B = 'user-bbb';

  // In-memory store for isolation verification
  const store = {
    projects: [
      { id: 'proj-1', tenantId: TENANT_A, name: 'Project Alpha', createdBy: USER_A, createdAt: new Date() },
      { id: 'proj-2', tenantId: TENANT_B, name: 'Project Beta', createdBy: USER_B, createdAt: new Date() },
    ],
    customers: [
      { id: 'cust-1', tenantId: TENANT_A, name: 'Customer Alpha', email: 'alpha@corp.com', createdAt: new Date() },
      { id: 'cust-2', tenantId: TENANT_B, name: 'Customer Beta', email: 'beta@corp.com', createdAt: new Date() },
    ],
    tasks: [
      { id: 'task-1', tenantId: TENANT_A, projectId: 'proj-1', title: 'Task Alpha', status: 'todo', priority: 'medium', createdAt: new Date() },
      { id: 'task-2', tenantId: TENANT_B, projectId: 'proj-2', title: 'Task Beta', status: 'todo', priority: 'medium', createdAt: new Date() },
    ],
  };

  const mockPrisma = {
    project: {
      findFirst: jest.fn().mockImplementation(({ where }: { where: { id: string; tenantId: string } }) => {
        const item = store.projects.find((p) => p.id === where.id && p.tenantId === where.tenantId);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where: { tenantId: string } }) => {
        return Promise.resolve(store.projects.filter((p) => p.tenantId === where.tenantId));
      }),
      create: jest.fn().mockImplementation(({ data }: { data: any }) => {
        const newItem = { id: `proj-${Date.now()}`, ...data, createdAt: new Date() };
        store.projects.push(newItem);
        return Promise.resolve(newItem);
      }),
      update: jest.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
        const idx = store.projects.findIndex((p) => p.id === where.id);
        store.projects[idx] = { ...store.projects[idx], ...data };
        return Promise.resolve(store.projects[idx]);
      }),
      delete: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        const idx = store.projects.findIndex((p) => p.id === where.id);
        const removed = store.projects.splice(idx, 1)[0];
        return Promise.resolve(removed);
      }),
    },
    tenantUsage: {
      upsert: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    customer: {
      findFirst: jest.fn().mockImplementation(({ where }: { where: { id?: string; tenantId: string; email?: string } }) => {
        const item = store.customers.find((c) => {
          if (where.id && (c.id !== where.id || c.tenantId !== where.tenantId)) return false;
          if (where.email && (c.email !== where.email || c.tenantId !== where.tenantId)) return false;
          return true;
        });
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where: { tenantId: string } }) => {
        return Promise.resolve(store.customers.filter((c) => c.tenantId === where.tenantId));
      }),
      count: jest.fn().mockImplementation(({ where }: { where: { tenantId: string } }) => {
        return Promise.resolve(store.customers.filter((c) => c.tenantId === where.tenantId).length);
      }),
    },
    task: {
      findFirst: jest.fn().mockImplementation(({ where }: { where: { id: string; tenantId: string } }) => {
        const item = store.tasks.find((t) => t.id === where.id && t.tenantId === where.tenantId);
        return Promise.resolve(item || null);
      }),
      findMany: jest.fn().mockImplementation(({ where }: { where: { tenantId: string } }) => {
        return Promise.resolve(store.tasks.filter((t) => t.tenantId === where.tenantId));
      }),
      update: jest.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
        const idx = store.tasks.findIndex((t) => t.id === where.id);
        store.tasks[idx] = { ...store.tasks[idx], ...data };
        return Promise.resolve(store.tasks[idx]);
      }),
      delete: jest.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        const idx = store.tasks.findIndex((t) => t.id === where.id);
        const removed = store.tasks.splice(idx, 1)[0];
        return Promise.resolve(removed);
      }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        CustomersService,
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    projectsService = module.get<ProjectsService>(ProjectsService);
    customersService = module.get<CustomersService>(CustomersService);
    tasksService = module.get<TasksService>(TasksService);
  });

  describe('1. Project Multi-Tenant Isolation', () => {
    it('Tenant A can read its own project', async () => {
      const project = await projectsService.findOne(TENANT_A, 'proj-1');
      expect(project).toBeDefined();
      expect(project.id).toBe('proj-1');
      expect(project.tenantId).toBe(TENANT_A);
    });

    it('Tenant B CANNOT read Tenant A project (Must throw NotFoundException)', async () => {
      await expect(projectsService.findOne(TENANT_B, 'proj-1')).rejects.toThrow(NotFoundException);
    });

    it('Tenant B CANNOT update Tenant A project', async () => {
      await expect(
        projectsService.update(TENANT_B, 'proj-1', { name: 'Hacked Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('Tenant B CANNOT delete Tenant A project', async () => {
      await expect(projectsService.remove(TENANT_B, 'proj-1')).rejects.toThrow(NotFoundException);
    });

    it('Tenant B list() only returns Tenant B projects, never Tenant A', async () => {
      const projects = await projectsService.list(TENANT_B);
      expect(projects.length).toBe(1);
      expect(projects[0].tenantId).toBe(TENANT_B);
      expect(projects.some((p) => p.tenantId === TENANT_A)).toBe(false);
    });
  });

  describe('2. Customer Multi-Tenant Isolation', () => {
    it('Tenant A can read its own customer', async () => {
      const customer = await customersService.findOne(TENANT_A, 'cust-1');
      expect(customer).toBeDefined();
      expect(customer.id).toBe('cust-1');
      expect(customer.tenantId).toBe(TENANT_A);
    });

    it('Tenant B CANNOT read Tenant A customer (Must throw BadRequestException)', async () => {
      await expect(customersService.findOne(TENANT_B, 'cust-1')).rejects.toThrow(BadRequestException);
    });

    it('Tenant B list() only returns Tenant B customers', async () => {
      const result = await customersService.findAll(TENANT_B);
      expect(result.data.length).toBe(1);
      expect(result.data[0].tenantId).toBe(TENANT_B);
      expect(result.data.some((c: any) => c.tenantId === TENANT_A)).toBe(false);
    });
  });

  describe('3. Task Multi-Tenant Isolation', () => {
    it('Tenant A can read its own task', async () => {
      const task = await tasksService.findOne(TENANT_A, 'task-1');
      expect(task).toBeDefined();
      expect(task.id).toBe('task-1');
      expect(task.tenantId).toBe(TENANT_A);
    });

    it('Tenant B CANNOT read Tenant A task', async () => {
      await expect(tasksService.findOne(TENANT_B, 'task-1')).rejects.toThrow(NotFoundException);
    });

    it('Tenant B CANNOT update Tenant A task', async () => {
      await expect(tasksService.update(TENANT_B, 'task-1', { title: 'Compromised' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Tenant B CANNOT delete Tenant A task', async () => {
      await expect(tasksService.remove(TENANT_B, 'task-1')).rejects.toThrow(NotFoundException);
    });

    it('Tenant B list() only returns Tenant B tasks', async () => {
      const tasks = await tasksService.list(TENANT_B);
      expect(tasks.length).toBe(1);
      expect(tasks[0].tenantId).toBe(TENANT_B);
      expect(tasks.some((t) => t.tenantId === TENANT_A)).toBe(false);
    });
  });
});
