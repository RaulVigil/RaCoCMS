import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { EntriesModule } from './modules/entries/entries.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { GlobalPartsModule } from './modules/global-parts/global-parts.module';
import { MenusModule } from './modules/menus/menus.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    AuthModule,
    CollectionsModule,
    EntriesModule,
    TemplatesModule,
    GlobalPartsModule,
    MenusModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
