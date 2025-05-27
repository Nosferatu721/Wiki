import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

import { Category } from './Category';

@Entity()
export class Management extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', default: '' })
  keywords: string;

  @Column({ type: 'text', default: '' })
  file: string;

  @Column({ nullable: false })
  createdBy: number;

  @ManyToOne(() => Category, (category) => category.management, { nullable: false })
  category: Category;

  @CreateDateColumn({ precision: 0 })
  createdAt: Date;

  @UpdateDateColumn({ precision: 0 })
  updatedAt: Date;

  @DeleteDateColumn({ precision: 0 })
  deletedAt: Date | null;
}
