import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
} from 'typeorm';
import { RepositoryEntity } from './repository.entity';
import { DataLoaderEntity } from './dataloader.entity';

@Entity('project')
export class ProjectEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(
    type => RepositoryEntity,
    repository => repository.project,
  )
  repositories: RepositoryEntity[];

  @OneToMany(
    type => DataLoaderEntity,
    dataloader => dataloader.project,
  )
  dataloaders: DataLoaderEntity[];
}
