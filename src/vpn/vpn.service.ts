import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VpnType } from './vpn-type.entity';
import { VpnConfig } from './vpn-config.entity';
import { Repository } from 'typeorm';
import supabase from 'src/supabase';
import * as fs from 'fs';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class VpnService {
  constructor(
    @InjectRepository(VpnType) private vpnTypeRepo: Repository<VpnType>,
    @InjectRepository(VpnConfig) private vpnConfigRepo: Repository<VpnConfig>,
    @Inject('SUPABASE_CLIENT') private supabase: SupabaseClient, // ✅ here
  ) {}

  async createType(name: string, icon: Express.Multer.File) {
    let iconUrl: string | null = null;

    if (icon) {
      const fileStream = fs.createReadStream(icon.path);
      const filename = `icons/${Date.now()}-${icon.originalname}`;

      const { data, error } = await this.supabase.storage
        .from('vpn-icons')
        .upload(filename, fileStream, {
          contentType: icon.mimetype,
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload icon: ${error.message}`);
      }

      iconUrl = this.supabase.storage.from('vpn-icons').getPublicUrl(filename)
        .data.publicUrl;
    }

    const type = this.vpnTypeRepo.create({ name, iconUrl });
    return this.vpnTypeRepo.save(type);
  }

  async uploadConfigs(typeId: string, files: Express.Multer.File[]) {
    const type = await this.vpnTypeRepo.findOne({ where: { id: typeId } });
    if (!type) throw new Error('VPN type not found');

    const uploadedConfigs: VpnConfig[] = [];

    for (const file of files.slice(0, 15)) {
      const { data, error } = await supabase.storage
        .from('vpn-postgres') // You must create this bucket in Supabase Storage
        .upload(
          `configs/${Date.now()}-${file.originalname}`,
          fs.createReadStream(file.path),
          {
            contentType: file.mimetype,
            upsert: true,
          },
        );

      if (error) throw new Error(`Failed to upload: ${error.message}`);

      const publicUrl = supabase.storage
        .from('vpn-postgres')
        .getPublicUrl(data.path).data.publicUrl;

      const config = this.vpnConfigRepo.create({
        filename: file.originalname,
        fileUrl: publicUrl,
        type,
      });

      uploadedConfigs.push(config);
    }

    return this.vpnConfigRepo.save(uploadedConfigs);
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
