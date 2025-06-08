import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { VpnType } from './vpn-type.entity';

@Entity()
export class VpnConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  fileUrl: string;

  @ManyToOne(() => VpnType, (type) => type.configs)
  type: VpnType;
}
