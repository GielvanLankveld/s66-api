import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { RepositoryEntity } from './repository.entity';
import { JobEntity } from './job.entity';
import { BranchEntity } from './branch.entity';
import { ProjectEntity } from './project.entity';

@Entity('dataloader')
export class DataLoaderEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(
    type => BranchEntity,
    branch => branch.dataloaders,
  )
  @JoinColumn({ name: 'branch_id' })
  branch: RepositoryEntity;

  @Column({ name: 'branch_id' })
  branchId: number;

  @ManyToOne(
    type => ProjectEntity,
    project => project.dataloaders,
  )
  @JoinColumn({ name: 'project_id' })
  project: RepositoryEntity;

  @Column({ name: 'project_id' })
  projectId: number;

  @OneToMany(
    type => JobEntity,
    job => job.dataloader,
  )
  jobs: JobEntity[];
}
