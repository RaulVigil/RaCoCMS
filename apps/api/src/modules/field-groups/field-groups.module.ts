import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldGroup } from './field-group.entity';
import { FieldGroupsService } from './field-groups.service';
import { FieldGroupsController } from './field-groups.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FieldGroup])],
  providers: [FieldGroupsService],
  controllers: [FieldGroupsController],
  exports: [FieldGroupsService],
})
export class FieldGroupsModule {}
