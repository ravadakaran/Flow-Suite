import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { EntitlementGuard } from '../../common/guards/entitlement.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Feature } from '../../common/decorators/feature.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtGuard, RbacGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.projectsService.list(user.tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.findOne(user.tenantId, id);
  }

  @Post()
  @Roles('member', 'admin', 'owner')
  @UseGuards(EntitlementGuard)
  @Feature('max_projects')
  create(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.tenantId, user.userId, dto);
  }

  @Patch(':id')
  @Roles('member', 'admin', 'owner')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'owner')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.remove(user.tenantId, id);
  }
}
