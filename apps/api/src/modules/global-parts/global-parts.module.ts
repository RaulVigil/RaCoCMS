import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlobalPart } from './global-part.entity';
import { GlobalPartsService } from './global-parts.service';
import { GlobalPartsController } from './global-parts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GlobalPart])],
  providers: [GlobalPartsService],
  controllers: [GlobalPartsController],
  exports: [GlobalPartsService],
})
export class GlobalPartsModule {}
