import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { Menu } from './menu.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenusController {
  constructor(private service: MenusService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: Partial<Menu>) {
    return this.service.create(data);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() data: Partial<Menu>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
