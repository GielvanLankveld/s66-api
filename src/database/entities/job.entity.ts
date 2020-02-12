import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DataLoaderEntity } from './dataloader.entity';
import { JobStatus } from '../enums/jobstatus';
import { JobStep } from '../enums/jobStep';

@Entity('job')
export class JobEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date | null;

  @Column({ type: 'enum', enum: JobStatus })
  status: JobStatus;

  @Column({ type: 'enum', enum: JobStep })
  step: JobStep;

  @Column({ type: 'text' })
  logs: string;

  @ManyToOne(
    type => DataLoaderEntity,
    dataloader => dataloader.jobs,
  )
  @JoinColumn({ name: 'dataloader_id' })
  dataloader: DataLoaderEntity;

  @Column({ name: 'dataloader_id' })
  dataloaderId: number;
}
