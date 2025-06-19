import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VpnType } from './vpn/vpn-type.entity';
import { VpnConfig } from './vpn/vpn-config.entity';
import { News } from './news/news.entity';
import { VpnModule } from './vpn/vpn.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { NewsModule } from './news/news.module';
import { AdminModule } from './admin/admin.module';
import { Admin } from './admin/admin.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Static files (для загрузки картинок и конфигов)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/uploads',
    }),

    // TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'dpg-d14sna49c44c73dmc3g0-a',
      port: 5432,
      username: 'vpn_db_user',
      password: 'SeDLhFeToNL6KONhKu1E6OaX8gyMVHft',
      database: 'vpn_db',
      entities: [VpnType, VpnConfig, News, Admin],
      synchronize: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // So you can use it everywhere
    }),
    // Наши модули
    VpnModule,
    NewsModule,
    AdminModule,
  ],
})
export class AppModule {}
