import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './news.entity';
import { Repository } from 'typeorm';
import { createReadStream } from 'fs';
import { SupabaseClient } from '@supabase/supabase-js'; // Make sure you have Supabase client

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News) private newsRepo: Repository<News>,
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient,
  ) {}

  async createNews(
    title: string,
    image: Express.Multer.File | null,
    downloadUrl: string | null,
  ) {
    let imageUrl: string | null = null;

    if (image) {
      const fileStream = createReadStream(image.path);
      const filename = `news-images/${Date.now()}-${image.originalname}`;

      const { data, error } = await this.supabase.storage
        .from('news-images')
        .upload(filename, fileStream, {
          contentType: image.mimetype,
          upsert: true,
        });

      if (error) throw new Error(`Failed to upload image: ${error.message}`);

      imageUrl = this.supabase.storage
        .from('news-images')
        .getPublicUrl(filename).data.publicUrl;
    }

    const news = this.newsRepo.create({ title, imageUrl, downloadUrl });
    return this.newsRepo.save(news);
  }

  async getAll() {
    return this.newsRepo.find({ take: 15 });
  }

  async deleteNews(id: string) {
    const newsItem = await this.newsRepo.findOneBy({ id });
    if (!newsItem) throw new Error('News not found');

    // Delete from Supabase (optional but recommended)
    if (newsItem.imageUrl) {
      const path = newsItem.imageUrl.split(
        '/storage/v1/object/public/news-images/',
      )[1];
      if (path) {
        await this.supabase.storage.from('news-images').remove([path]);
      }
    }

    await this.newsRepo.remove(newsItem);
    return { message: 'News deleted successfully' };
  }
}
