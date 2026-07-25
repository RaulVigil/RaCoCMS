import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'editor')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-site')
  generateSite(@Body('prompt') prompt: string) {
    return this.aiService.generateSite(prompt);
  }

  @Post('parse-figma')
  parseFigma(@Body('figmaUrl') figmaUrl: string) {
    return this.aiService.parseFigma(figmaUrl);
  }
}
