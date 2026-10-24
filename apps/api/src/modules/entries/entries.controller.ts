import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { EntriesService, type Author } from './entries.service';
import { Entry } from './entry.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// El usuario que hace la petición (lo deja JwtStrategy) queda como autor de cada versión
type AuthedRequest = { user: Author };

@Controller('entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntriesController {
  constructor(private service: EntriesService) {}

  @Get(':collectionId')
  findAll(@Param('collectionId') collectionId: string, @Query('status') status?: string) {
    return this.service.findByCollection(collectionId, status);
  }

  // Usado por el editor del panel (el slug puede cambiar, el id no)
  @Get(':collectionId/id/:id')
  findOne(@Param('collectionId') collectionId: string, @Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(collectionId, id);
  }

  @Get(':collectionId/:slug')
  findBySlug(@Param('collectionId') collectionId: string, @Param('slug') slug: string) {
    return this.service.findBySlug(collectionId, slug);
  }

  @Post(':collectionId')
  @Roles('admin', 'editor')
  create(@Param('collectionId') collectionId: string, @Body() data: Partial<Entry>, @Req() req: AuthedRequest) {
    return this.service.create({ ...data, collectionId }, req.user);
  }

  @Put(':collectionId/:id')
  @Roles('admin', 'editor')
  update(
    @Param('collectionId') collectionId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<Entry>,
    @Req() req: AuthedRequest,
  ) {
    return this.service.update(collectionId, id, data, req.user);
  }

  @Delete(':collectionId/:id')
  @Roles('admin', 'editor')
  remove(@Param('collectionId') collectionId: string, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(collectionId, id);
  }

  // --- Historial de versiones ---

  @Get(':collectionId/:id/revisions')
  revisions(@Param('collectionId') collectionId: string, @Param('id', ParseIntPipe) id: number) {
    return this.service.listRevisions(collectionId, id);
  }

  @Get(':collectionId/:id/revisions/:revisionId')
  revision(
    @Param('collectionId') collectionId: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('revisionId', ParseIntPipe) revisionId: number,
  ) {
    return this.service.getRevision(collectionId, id, revisionId);
  }

  @Post(':collectionId/:id/revisions/:revisionId/restore')
  @Roles('admin', 'editor')
  restore(
    @Param('collectionId') collectionId: string,
    @Param('id', ParseIntPipe) id: number,
    @Param('revisionId', ParseIntPipe) revisionId: number,
    @Req() req: AuthedRequest,
  ) {
    return this.service.restore(collectionId, id, revisionId, req.user);
  }
}
