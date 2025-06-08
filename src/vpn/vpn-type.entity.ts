import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { VpnConfig } from './vpn-config.entity';

@Entity()
export class VpnType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  iconUrl: string | null;

  @OneToMany(() => VpnConfig, (config) => config.type)
  configs: VpnConfig[];
}
