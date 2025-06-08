import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;
}
