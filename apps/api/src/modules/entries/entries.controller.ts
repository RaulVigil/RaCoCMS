import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { Entry } from './entry.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntriesController {
  constructor(private service: EntriesService) {}

  @Get(':collectionId')
  findAll(@Param('collectionId') collectionId: string, @Query('status') status?: string) {
    return this.service.findByCollection(collectionId, status);
  }

  @Get(':collectionId/:slug')
  findBySlug(@Param('collectionId') collectionId: string, @Param('slug') slug: string) {
    return this.service.findBySlug(collectionId, slug);
  }

  @Post(':collectionId')
  @Roles('admin', 'editor')
  create(@Param('collectionId') collectionId: string, @Body() data: Partial<Entry>) {
    return this.service.create({ ...data, collectionId });
  }

  @Put(':collectionId/:id')
  @Roles('admin', 'editor')
  update(@Param('id') id: string, @Body() data: Partial<Entry>) {
    return this.service.update(+id, data);
  }

  @Delete(':collectionId/:id')
  @Roles('admin', 'editor')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
