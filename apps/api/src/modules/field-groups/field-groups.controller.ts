import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FieldGroupsService } from './field-groups.service';
import { FieldGroup } from './field-group.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('field-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FieldGroupsController {
  constructor(private service: FieldGroupsService) {}

  @Get()
  findAll(@Query('collectionId') collectionId?: string) {
    return collectionId ? this.service.findByCollection(collectionId) : this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<FieldGroup>) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<FieldGroup>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
