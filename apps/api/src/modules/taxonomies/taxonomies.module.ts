import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Taxonomy } from './taxonomy.entity';
import { TaxonomiesService } from './taxonomies.service';
import { TaxonomiesController } from './taxonomies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Taxonomy])],
  providers: [TaxonomiesService],
  controllers: [TaxonomiesController],
  exports: [TaxonomiesService],
})
export class TaxonomiesModule {}
