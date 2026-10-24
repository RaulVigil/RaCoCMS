import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { Setting } from '../settings/setting.entity';
import { Media } from '../media/media.entity';

@Module({
  // Ajustes y biblioteca solo se leen: dan contexto (nombre, idioma, imágenes) al generar páginas
  imports: [TypeOrmModule.forFeature([Setting, Media])],
  providers: [AiService],
  controllers: [AiController],
  exports: [AiService],
})
export class AiModule {}
