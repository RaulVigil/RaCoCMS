import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { Template } from './template.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private service: TemplatesService) {}

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
  create(@Body() data: Partial<Template>) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<Template>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
