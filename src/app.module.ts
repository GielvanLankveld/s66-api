import { ValidationService } from 'src/services/validation';
import { Module, OnModuleInit } from '@nestjs/common';
import { RepositoryController } from './controllers/repository.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './database/entities/project.entity';
import { SchemeBuilderService } from './services/scheme-builder';
import { RepositoryEntity } from './database/entities/repository.entity';
import { DataLoaderEntity } from './database/entities/dataloader.entity';
import { JobEntity } from './database/entities/job.entity';
import { BranchEntity } from './database/entities/branch.entity';
import { ProjectController } from './controllers/project.controller';
import { InitialDatabase1581534216930 } from './database/migrations/1581534216930-InitialDatabase';
import { RepositoryService } from './services/repository';
import * as Queue from 'bull';
import { BRANCH_QUEUE, RUN_QUEUE } from './constants';
import { BranchJob } from './jobs/branch.job';
import { AddBranchError1581548495214 } from './database/migrations/1581548495214-AddBranchError';
import { CommitsNullable1581549891065 } from './database/migrations/1581549891065-CommitsNullable';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all.exception';
import { JobController } from './controllers/job.controller';
import { JobService } from './services/job';
import { RunJob } from './jobs/run.job';

const branchQueue = new Queue<BranchJob>('branch', 'redis://redis:6379');
const runQueue = new Queue<RunJob>('job', 'redis://redis:6379');

const ENTITIES = [
  ProjectEntity,
  RepositoryEntity,
  BranchEntity,
  DataLoaderEntity,
  JobEntity,
];
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: ENTITIES,
      migrations: [
        InitialDatabase1581534216930,
        AddBranchError1581548495214,
        CommitsNullable1581549891065,
      ],
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  controllers: [ProjectController, RepositoryController, JobController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    SchemeBuilderService,
    RepositoryService,
    JobService,
    ValidationService,
    { provide: BRANCH_QUEUE, useValue: branchQueue },
    { provide: RUN_QUEUE, useValue: runQueue },
  ],
})
export class AppModule {}
