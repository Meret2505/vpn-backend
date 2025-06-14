import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VpnType } from './vpn-type.entity';
import { VpnConfig } from './vpn-config.entity';
import { Repository } from 'typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class VpnService {
  constructor(
    @InjectRepository(VpnType) private vpnTypeRepo: Repository<VpnType>,
    @InjectRepository(VpnConfig) private vpnConfigRepo: Repository<VpnConfig>,
  ) {}

  async createType(name: string, iconUrl: string | null) {
    const type = this.vpnTypeRepo.create({ name, iconUrl });
    return this.vpnTypeRepo.save(type);
  }

  async uploadConfigs(typeId: string, files: Express.Multer.File[]) {
    const type = await this.vpnTypeRepo.findOne({ where: { id: typeId } });
    if (!type) throw new Error('VPN type not found');

    const configs = files.slice(0, 15).map((file) =>
      this.vpnConfigRepo.create({
        filename: file.originalname,
        fileUrl: `/uploads/configs/${file.filename}`,
        type,
      }),
    );
    return this.vpnConfigRepo.save(configs);
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

    // Delete associated config files from disk
    for (const config of type.configs) {
      if (!config.fileUrl) continue;

      const filename = config.fileUrl.split('/').pop();
      if (!filename) continue;

      const filePath = join(
        __dirname,
        '..',
        '..',
        'uploads',
        'configs',
        filename,
      );

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }

    // Delete database records
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

    const parts = config.fileUrl.split('/');
    const filename = parts.pop();

    if (!filename) {
      throw new Error(`Failed to extract filename from file URL`);
    }

    const filePath = join(
      __dirname,
      '..',
      '..',
      'uploads',
      'configs',
      filename,
    );

    // Delete file from disk
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    await this.vpnConfigRepo.delete(id);

    return { message: 'Config deleted successfully' };
  }
}
