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
import { BRANCH_QUEUE } from './constants';
import { BranchJob } from './jobs/branch.job';
import { AddBranchError1581548495214 } from './database/migrations/1581548495214-AddBranchError';
import { CommitsNullable1581549891065 } from './database/migrations/1581549891065-CommitsNullable';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/all.exception';

const branchQueue = new Queue<BranchJob>('branch', 'redis://redis:6379');

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
  controllers: [ProjectController, RepositoryController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    SchemeBuilderService,
    RepositoryService,
    { provide: BRANCH_QUEUE, useValue: branchQueue },
  ],
})
export class AppModule {}
