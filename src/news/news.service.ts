import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './news.entity';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class NewsService {
  constructor(@InjectRepository(News) private newsRepo: Repository<News>) {}

  async createNews(
    title: string,
    imageUrl: string | null,
    downloadUrl: string | null,
  ) {
    const news = this.newsRepo.create({ title, imageUrl, downloadUrl });
    return this.newsRepo.save(news);
  }

  async getAll() {
    return this.newsRepo.find({ take: 15 });
  }

  async deleteNews(id: string) {
    const newsItem = await this.newsRepo.findOneBy({ id });

    if (!newsItem) {
      throw new Error('News not found');
    }

    // Optionally delete image file
    if (newsItem.imageUrl) {
      const imageUrlParts = newsItem.imageUrl.split('/');
      const filename = imageUrlParts[imageUrlParts.length - 1];

      if (!filename) {
        throw new Error(`Could not extract filename from imageUrl`);
      }

      const imagePath = join(
        __dirname,
        '..',
        '..',
        'uploads',
        'news-images',
        filename,
      );

      if (existsSync(imagePath)) {
        unlinkSync(imagePath);
      }
    }

    // Delete DB record
    await this.newsRepo.remove(newsItem);

    return { message: 'News deleted successfully' };
  }
}
