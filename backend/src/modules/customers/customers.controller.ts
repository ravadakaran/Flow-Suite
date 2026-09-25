import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './customers.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { EntitlementGuard } from '../../common/guards/entitlement.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtGuard, RbacGuard, EntitlementGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('admin', 'owner')
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.findAll(
      user.tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('search')
  @Roles('admin', 'owner')
  async search(
    @CurrentUser() user: any,
    @Query('q') query?: string,
    @Query('limit') limit?: string,
  ) {
    if (!query) return [];
    return this.customersService.search(
      user.tenantId,
      query,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id')
  @Roles('admin', 'owner')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @Post()
  @Roles('admin', 'owner')
  async create(@CurrentUser() user: any, @Body() data: CreateCustomerDto) {
    return this.customersService.create(user.tenantId, data);
  }

  @Patch(':id')
  @Roles('admin', 'owner')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.tenantId, id, data);
  }

  @Delete(':id')
  @Roles('admin', 'owner')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.customersService.delete(user.tenantId, id);
  }
}
