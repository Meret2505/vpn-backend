import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './news.entity';
import { Repository } from 'typeorm';

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
}
