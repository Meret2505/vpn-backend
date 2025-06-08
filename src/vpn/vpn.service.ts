import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VpnType } from './vpn-type.entity';
import { VpnConfig } from './vpn-config.entity';
import { Repository } from 'typeorm';

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
}
