import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Param,
  Res,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { createReadStream } from 'fs';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/news-images',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async create(
    @UploadedFile() image: Express.Multer.File,
    @Body('title') title: string,
    @Body('downloadUrl') downloadUrl: string,
  ) {
    const imageUrl = image ? `/uploads/news-images/${image.filename}` : null;

    return this.newsService.createNews(title, imageUrl, downloadUrl);
  }

  @Get('list')
  getAll() {
    return this.newsService.getAll();
  }
}
