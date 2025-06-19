import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  UploadedFile,
  UseGuards,
  Param,
  Res,
  Delete,
} from '@nestjs/common';
import { VpnService } from './vpn.service';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { existsSync, unlinkSync } from 'fs';

@Controller('vpn')
export class VpnController {
  constructor(private readonly vpnService: VpnService) {}

  // Create Type
  @UseGuards(AuthGuard('jwt'))
  @Post('type')
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: diskStorage({
        destination: './uploads/icons', // still needed for temporary storage
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async createVpnType(
    @UploadedFile() icon: Express.Multer.File,
    @Body('name') name: string,
  ) {
    // ✅ Now pass the file instead of a string URL
    return this.vpnService.createType(name, icon);
  }

  // Upload Configs
  @UseGuards(AuthGuard('jwt'))
  @Post('upload-configs')
  @UseInterceptors(
    FilesInterceptor('files', 15, {
      storage: diskStorage({
        destination: './uploads/configs',
        filename: (req, file, cb) => {
          const filename = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
    }),
  )
  uploadConfigs(
    @Body('typeId') typeId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.vpnService.uploadConfigs(typeId, files);
  }

  // Get All Types
  @Get('types')
  async getTypes() {
    return this.vpnService.getAllTypes();
  }

  // Get All Configs
  @Get('list')
  getConfigs() {
    return this.vpnService.getAllConfigs();
  }

  // Download Config
  @Get('download/:filename')
  downloadConfig(@Param('filename') filename: string, @Res() res: Response) {
    const file = join(__dirname, '..', '..', 'uploads', 'configs', filename);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    const stream = createReadStream(file);
    return stream.pipe(res);
  }

  // DELETE VPN Type (with its configs)
  @UseGuards(AuthGuard('jwt'))
  @Delete('type/:id')
  async deleteType(@Param('id') id: string) {
    return this.vpnService.deleteType(id);
  }

  // DELETE Single Config
  @UseGuards(AuthGuard('jwt'))
  @Delete('config/:id')
  async deleteConfig(@Param('id') id: string) {
    return this.vpnService.deleteConfig(id);
  }
}
