import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Management } from './Managements'; // Assuming Post is the entity for procedures

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  grupo: string;

  @Column()
  sub_grupo: string;

  @Column()
  skill: string;

  @Column({ default: null })
  createdBy: number;

  @CreateDateColumn({ precision: 0 })
  createdAt: Date;

  @UpdateDateColumn({ precision: 0 })
  updatedAt: Date;

  @DeleteDateColumn({ precision: 0 })
  deletedAt: Date | null;

  @OneToMany(() => Management, (management) => management.category)
  management: Management[];
}
