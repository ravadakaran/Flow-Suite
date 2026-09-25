import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, ValidateIf } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  projectId: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsDateString()
  dueDate?: string | null;
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsUUID()
  assigneeId?: string | null;

  @IsOptional()
  @ValidateIf((_, val) => val !== null && val !== undefined && val !== '')
  @IsDateString()
  dueDate?: string | null;
}
