import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { Media } from './media.entity';
import { Entry } from '../entries/entry.entity';
import { GlobalPart } from '../global-parts/global-part.entity';
import { Template } from '../templates/template.entity';
import { Setting } from '../settings/setting.entity';

@Module({
  // El resto de entidades solo se leen para saber dónde se usa cada imagen
  imports: [TypeOrmModule.forFeature([Media, Entry, GlobalPart, Template, Setting])],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
