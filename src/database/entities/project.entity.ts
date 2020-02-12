import { BaseEntity, PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity('project')
export class ProjectEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
