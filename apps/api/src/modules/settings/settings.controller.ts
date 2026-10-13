import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get(':key')
  get(@Param('key') key: string) {
    return this.service.get(key);
  }

  @Put(':key')
  @Roles('admin')
  set(@Param('key') key: string, @Body() body: { value: unknown }) {
    return this.service.set(key, body?.value);
  }
}
