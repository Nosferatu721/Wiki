import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @CreateDateColumn({ precision: 0 })
  createdAt: Date;

  @UpdateDateColumn({ precision: 0 })
  updatedAt: Date;

  @DeleteDateColumn({ precision: 0 })
  deletedAt: Date | null;
}
