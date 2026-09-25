import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './tenants.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: { usage: true },
    });
    if (!tenant) throw new NotFoundException('Workspace not found');
    if (tenant.usage?.storageBytes) {
      (tenant.usage as any).storageBytes = Number(tenant.usage.storageBytes);
    }
    return tenant;
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { usage: true },
    });
    if (!tenant) throw new NotFoundException('Workspace not found');
    if (tenant.usage?.storageBytes) {
      (tenant.usage as any).storageBytes = Number(tenant.usage.storageBytes);
    }
    return tenant;
  }

  async update(tenantId: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: dto,
    });
  }

  async remove(tenantId: string) {
    await this.findById(tenantId);
    await this.prisma.tenant.delete({ where: { id: tenantId } });
    return { message: 'Workspace deleted successfully' };
  }

  async leave(tenantId: string, userId: string) {
    await this.prisma.tenantMember.deleteMany({
      where: { tenantId, userId },
    });
    return { message: 'Left workspace successfully' };
  }
}
