import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry } from '../entries/entry.entity';
import { Collection } from '../collections/collection.entity';
import { FieldGroup } from '../field-groups/field-group.entity';
import { Setting } from '../settings/setting.entity';
import { GlobalPart } from '../global-parts/global-part.entity';
import { Menu } from '../menus/menu.entity';
import { Template } from '../templates/template.entity';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, Collection, FieldGroup, Setting, GlobalPart, Menu, Template])],
  providers: [PublicService],
  controllers: [PublicController],
})
export class PublicModule {}
