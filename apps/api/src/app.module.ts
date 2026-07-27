import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { EntriesModule } from './modules/entries/entries.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { GlobalPartsModule } from './modules/global-parts/global-parts.module';
import { MenusModule } from './modules/menus/menus.module';
import { AiModule } from './modules/ai/ai.module';
import { MediaModule } from './modules/media/media.module';
import { EventBusService } from './common/event-bus.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '.env'),
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    CollectionsModule,
    EntriesModule,
    TemplatesModule,
    GlobalPartsModule,
    MenusModule,
    AiModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventBusService],
})
export class AppModule {}
