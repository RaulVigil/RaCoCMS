import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
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
  findAll() {
    return this.mediaService.getFiles();
  }

  @Delete(':filename')
  @Roles('admin')
  remove(@Param('filename') filename: string) {
    return this.mediaService.deleteFile(filename);
  }
}
