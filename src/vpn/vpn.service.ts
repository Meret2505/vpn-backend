import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VpnType } from './vpn-type.entity';
import { VpnConfig } from './vpn-config.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class VpnService {
  private readonly logger = new Logger(VpnService.name);

  constructor(
    @InjectRepository(VpnType) private vpnTypeRepo: Repository<VpnType>,
    @InjectRepository(VpnConfig) private vpnConfigRepo: Repository<VpnConfig>,
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient, // ✅ here
  ) {}

  async createType(name: string, icon: Express.Multer.File) {
    let iconUrl: string | null = null;

    this.logger.log(`Creating VPN type with name: ${name}`);

    if (icon) {
      const fileStream = fs.createReadStream(icon.path);
      const filename = `icons/${Date.now()}-${icon.originalname}`;

      this.logger.log(`Uploading icon to Supabase: ${filename}`);

      const { data, error } = await this.supabase.storage
        .from('vpn-icons')
        .upload(filename, fileStream, {
          contentType: icon.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error('Supabase icon upload failed:', error.message);
        throw new InternalServerErrorException(
          `Icon upload failed: ${error.message}`,
        );
      }

      iconUrl = this.supabase.storage.from('vpn-icons').getPublicUrl(filename)
        .data.publicUrl;
      this.logger.log(`Icon uploaded successfully: ${iconUrl}`);
    }

    try {
      const type = this.vpnTypeRepo.create({ name, iconUrl });
      const saved = await this.vpnTypeRepo.save(type);
      this.logger.log(`VPN type saved with ID: ${saved.id}`);
      return saved;
    } catch (err) {
      this.logger.error('DB insert failed for VPN type', err.message);
      throw new InternalServerErrorException(
        'Failed to create VPN type in database',
      );
    }
  }

  async uploadConfigs(typeId: string, files: Express.Multer.File[]) {
    this.logger.log(`Uploading configs for VPN type: ${typeId}`);

    const type = await this.vpnTypeRepo.findOne({ where: { id: typeId } });
    if (!type) {
      this.logger.warn(`VPN type not found: ${typeId}`);
      throw new NotFoundException(`VPN type with ID ${typeId} not found`);
    }

    const uploadedConfigs: VpnConfig[] = [];

    for (const file of files.slice(0, 15)) {
      const filename = `configs/${Date.now()}-${file.originalname}`;

      this.logger.log(`Uploading config: ${filename}`);

      const { data, error } = await this.supabase.storage
        .from('vpn-postgres')
        .upload(filename, fs.createReadStream(file.path), {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Upload failed for ${filename}`, error.message);
        throw new BadRequestException(
          `Failed to upload config: ${error.message}`,
        );
      }

      const publicUrl = this.supabase.storage
        .from('vpn-postgres')
        .getPublicUrl(data.path).data.publicUrl;

      const config = this.vpnConfigRepo.create({
        filename: file.originalname,
        fileUrl: publicUrl,
        type,
      });

      uploadedConfigs.push(config);
      this.logger.log(`Config uploaded: ${publicUrl}`);
    }

    try {
      const saved = await this.vpnConfigRepo.save(uploadedConfigs);
      this.logger.log(`Saved ${saved.length} configs`);
      return saved;
    } catch (err) {
      this.logger.error('Failed to save configs to DB', err.message);
      throw new InternalServerErrorException(
        'Failed to save VPN configs to the database',
      );
    }
  }

  async getAllTypes() {
    return this.vpnTypeRepo.find({ take: 15 });
  }

  async getAllConfigs() {
    return this.vpnConfigRepo.find({ relations: ['type'], take: 15 });
  }

  // Delete a type and all associated configs
  async deleteType(id: string) {
    const type = await this.vpnTypeRepo.findOne({
      where: { id },
      relations: ['configs'],
    });

    if (!type) throw new Error('VPN type not found');

    for (const config of type.configs) {
      if (!config.fileUrl) continue;

      // Extract the relative path from public URL
      const storagePath = this.extractStoragePath(config.fileUrl);
      if (storagePath) {
        await this.supabase.storage.from('vpn-icons').remove([storagePath]);
      }
    }

    // Optionally delete the icon too
    if (type.iconUrl) {
      const iconPath = this.extractStoragePath(type.iconUrl);
      if (iconPath) {
        await this.supabase.storage.from('vpn-icons').remove([iconPath]);
      }
    }

    // Delete from DB
    await this.vpnConfigRepo.delete(type.configs.map((c) => c.id));
    await this.vpnTypeRepo.delete(id);

    return { message: 'Type and associated configs deleted successfully' };
  }

  // Delete single config
  async deleteConfig(id: string) {
    const config = await this.vpnConfigRepo.findOne({
      where: { id },
      relations: ['type'],
    });

    if (!config) throw new Error('Config not found');

    const storagePath = this.extractStoragePath(config.fileUrl);
    if (storagePath) {
      await this.supabase.storage.from('vpn-icons').remove([storagePath]);
    }

    await this.vpnConfigRepo.delete(id);

    return { message: 'Config deleted successfully' };
  }

  private extractStoragePath(publicUrl: string): string | null {
    const parts = publicUrl.split('/object/public/vpn-icons/');
    if (parts.length === 2) {
      return parts[1];
    }
    return null;
  }
}
