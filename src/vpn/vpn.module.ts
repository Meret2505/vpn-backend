import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VpnType } from './vpn-type.entity';
import { VpnConfig } from './vpn-config.entity';
import { VpnService } from './vpn.service';
import { VpnController } from './vnp.controller';
import { SupabaseModule } from 'src/supabase.module';

@Module({
  imports: [TypeOrmModule.forFeature([VpnType, VpnConfig]), SupabaseModule],
  providers: [VpnService],
  controllers: [VpnController],
})
export class VpnModule {}
