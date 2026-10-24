import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @Roles('admin', 'editor')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.processAndSave(file);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.mediaService.list(search ?? '', Number(page) || 1, Number(limit) || 60);
  }

  @Get(':id/usage')
  usage(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.usage(id);
  }

  @Put(':id')
  @Roles('admin', 'editor')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { alt?: string }) {
    return this.mediaService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
