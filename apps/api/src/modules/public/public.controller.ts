import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';

// Sin guards: lo consume el front público (Astro). Solo lectura y solo contenido publicado.
@Controller('public')
export class PublicController {
  constructor(private service: PublicService) {}

  @Get('site')
  site() {
    return this.service.site();
  }

  @Get('home')
  home() {
    return this.service.home();
  }

  @Get('sitemap')
  sitemap() {
    return this.service.sitemap();
  }

  @Get('collections')
  collections() {
    return this.service.listCollections();
  }

  @Get('entries/:collectionId')
  entries(@Param('collectionId') collectionId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.listEntries(collectionId, Number(page) || 1, Number(limit) || 12);
  }

  @Get('entries/:collectionId/:slug')
  entry(@Param('collectionId') collectionId: string, @Param('slug') slug: string) {
    return this.service.entry(collectionId, slug);
  }
}
