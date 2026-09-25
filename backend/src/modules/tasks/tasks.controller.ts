import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtGuard, RbacGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@CurrentUser() user: any, @Query('projectId') projectId?: string) {
    return this.tasksService.list(user.tenantId, projectId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.findOne(user.tenantId, id);
  }

  @Post()
  @Roles('member', 'admin', 'owner')
  create(@CurrentUser() user: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.tenantId, user.userId, dto);
  }

  @Patch(':id')
  @Roles('member', 'admin', 'owner')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles('member', 'admin', 'owner')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.remove(user.tenantId, id);
  }
}
