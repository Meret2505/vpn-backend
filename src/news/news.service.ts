import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from './news.entity';
import { Repository } from 'typeorm';
import { SupabaseClient } from '@supabase/supabase-js'; // Make sure you have Supabase client
import * as fs from 'fs';

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
    const logger = new Logger('NewsService');

    logger.log(`Creating news: ${title}`);

    if (image) {
      const filename = `news-images/${Date.now()}-${image.originalname}`;
      logger.log(`Uploading news image to Supabase: ${filename}`);

      try {
        const fileBuffer = fs.readFileSync(image.path); // ✅ FIX: Avoid duplex error

        const { data, error } = await this.supabase.storage
          .from('news-images')
          .upload(filename, fileBuffer, {
            contentType: image.mimetype,
            upsert: true,
          });

        if (error) {
          logger.error(`Image upload failed: ${error.message}`);
          throw new InternalServerErrorException(
            `Image upload failed: ${error.message}`,
          );
        }

        imageUrl = this.supabase.storage
          .from('news-images')
          .getPublicUrl(filename).data.publicUrl;

        logger.log(`Image uploaded successfully: ${imageUrl}`);

        fs.unlinkSync(image.path); // ✅ Optional cleanup
      } catch (err) {
        logger.error(`Error during upload: ${err.message}`);
        throw new InternalServerErrorException(
          `Failed to upload news image: ${err.message}`,
        );
      }
    }

    try {
      const news = this.newsRepo.create({ title, imageUrl, downloadUrl });
      const saved = await this.newsRepo.save(news);
      logger.log(`News saved with ID: ${saved.id}`);
      return saved;
    } catch (err) {
      logger.error(`DB insert failed: ${err.message}`);
      throw new InternalServerErrorException(
        'Failed to save news to database.',
      );
    }
  }

  async getAll() {
    return this.newsRepo.find({ take: 15 });
  }

  async deleteNews(id: string) {
    const logger = new Logger('NewsService');
    logger.log(`Deleting news with ID: ${id}`);

    const newsItem = await this.newsRepo.findOneBy({ id });

    if (!newsItem) {
      logger.warn(`News not found: ${id}`);
      throw new NotFoundException('News not found');
    }

    // Delete image from Supabase if exists
    if (newsItem.imageUrl) {
      const path = newsItem.imageUrl.split(
        '/storage/v1/object/public/news-images/',
      )[1];

      if (path) {
        try {
          const { error } = await this.supabase.storage
            .from('news-images')
            .remove([path]);

          if (error) {
            logger.error(
              `Failed to delete image from Supabase: ${error.message}`,
            );
          } else {
            logger.log(`Deleted image from Supabase: ${path}`);
          }
        } catch (err) {
          logger.error(`Error while removing image: ${err.message}`);
        }
      } else {
        logger.warn(
          `Failed to extract path from imageUrl: ${newsItem.imageUrl}`,
        );
      }
    }

    try {
      await this.newsRepo.remove(newsItem);
      logger.log(`News deleted from DB: ${id}`);
      return { message: 'News deleted successfully' };
    } catch (err) {
      logger.error(`Database error during deletion: ${err.message}`);
      throw new InternalServerErrorException(
        'Failed to delete news from database',
      );
    }
  }
}
