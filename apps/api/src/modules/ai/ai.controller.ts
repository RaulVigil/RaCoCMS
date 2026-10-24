import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import type { IAiPageRequest } from '@raco/shared';
import { AiService, type FieldAction } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
export class AiController {
  constructor(private aiService: AiService) {}

  // Acciones sobre un campo: SEO, reescribir, traducir, texto alternativo
  @Post('field')
  field(@Body() body: FieldAction) {
    return this.aiService.fieldAction(body);
  }

  // Arma una página (o secciones) a partir de una descripción: devuelve la receta ya validada
  @Post('generate-page')
  generatePage(@Body() body: IAiPageRequest) {
    return this.aiService.generatePage(body);
  }

  @Post('parse-figma')
  parseFigma(@Body('figmaUrl') figmaUrl: string) {
    return this.aiService.parseFigma(figmaUrl);
  }
}
