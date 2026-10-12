import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TaxonomiesService } from './taxonomies.service';
import { Taxonomy } from './taxonomy.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('taxonomies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaxonomiesController {
  constructor(private service: TaxonomiesService) {}

  @Get()
  findAll(@Query('collectionId') collectionId?: string) {
    return collectionId ? this.service.findByCollection(collectionId) : this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<Taxonomy>) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<Taxonomy>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
