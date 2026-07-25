import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './menu.entity';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Menu])],
  providers: [MenusService],
  controllers: [MenusController],
  exports: [MenusService],
})
export class MenusModule {}
