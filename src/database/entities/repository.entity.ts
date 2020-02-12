import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { BranchEntity } from './branch.entity';

@Entity('repository')
export class RepositoryEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 3000 })
  url: string;

  @ManyToOne(
    type => ProjectEntity,
    project => project.repositories,
  )
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'project_id' })
  projectId: number;

  @OneToMany(
    type => BranchEntity,
    branch => branch.repository,
  )
  branches: BranchEntity[];
}
