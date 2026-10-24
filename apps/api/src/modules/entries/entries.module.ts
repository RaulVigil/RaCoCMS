import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry } from './entry.entity';
import { EntryRevision } from './entry-revision.entity';
import { EntriesService } from './entries.service';
import { EntriesController } from './entries.controller';
import { EntriesScheduler } from './entries.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, EntryRevision])],
  providers: [EntriesService, EntriesScheduler],
  controllers: [EntriesController],
  exports: [EntriesService],
})
export class EntriesModule {}
