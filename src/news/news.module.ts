import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from './news.entity';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { SupabaseModule } from 'src/supabase.module';

@Module({
  imports: [TypeOrmModule.forFeature([News]), SupabaseModule],
  providers: [NewsService],
  controllers: [NewsController],
})
export class NewsModule {}
