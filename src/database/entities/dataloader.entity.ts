import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { JobEntity } from './job.entity';
import { BranchEntity } from './branch.entity';
import { ProjectEntity } from './project.entity';
import { DataLoaderStatus } from '../enums/dataloaderStatus';

@Entity('dataloader')
export class DataLoaderEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: DataLoaderStatus })
  status: DataLoaderStatus;

  @ManyToOne(
    type => BranchEntity,
    branch => branch.dataloaders,
  )
  @JoinColumn({ name: 'branch_id' })
  branch: BranchEntity;

  @Column({ name: 'branch_id' })
  branchId: number;

  @ManyToOne(
    type => ProjectEntity,
    project => project.dataloaders,
  )
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ name: 'project_id' })
  projectId: number;

  @OneToMany(
    type => JobEntity,
    job => job.dataloader,
  )
  jobs: JobEntity[];
}
