import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateCustomerDto) {
    // Check if email already exists for this tenant
    if (data.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, email: data.email },
      });
      if (existing) {
        throw new BadRequestException(
          `Customer with email ${data.email} already exists in this workspace`,
        );
      }
    }

    return this.prisma.customer.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  async findAll(tenantId: string, page = 1, limit = 20) {
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { projects: true } } },
      }),
      this.prisma.customer.count({ where: { tenantId } }),
    ]);

    return {
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: { projects: { select: { id: true, name: true } } },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    return customer;
  }

  async update(tenantId: string, id: string, data: UpdateCustomerDto) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Check if new email conflicts with another customer
    if (data.email && data.email !== customer.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { tenantId, email: data.email },
      });
      if (existing) {
        throw new BadRequestException(
          `Customer with email ${data.email} already exists in this workspace`,
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data,
      include: { _count: { select: { projects: true } } },
    });
  }

  async delete(tenantId: string, id: string) {
    // Verify customer exists and belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Unlink projects from this customer before deleting
    await this.prisma.project.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    return this.prisma.customer.delete({ where: { id } });
  }

  async search(tenantId: string, query: string, limit = 10) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, name: true, email: true, company: true },
    });
  }
}
