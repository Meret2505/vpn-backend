import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'text', nullable: true })
  downloadUrl: string | null;
}
