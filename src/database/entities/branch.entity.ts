import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { DataLoaderEntity } from './dataloader.entity';
import { RepositoryEntity } from './repository.entity';
import { BranchStatus } from '../enums/branchStatus';

@Entity('branch')
export class BranchEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 1000 })
  name: string;

  @Column({ type: 'enum', enum: BranchStatus })
  status: BranchStatus;

  @Column({ type: 'int' })
  commits: number;

  @ManyToOne(
    type => RepositoryEntity,
    repository => repository.branches,
  )
  @JoinColumn({ name: 'repository_id' })
  repository: RepositoryEntity;

  @Column({ name: 'repository_id' })
  repositoryId: number;

  @OneToMany(
    type => DataLoaderEntity,
    dataloader => dataloader.branch,
  )
  dataloaders: DataLoaderEntity[];
}
