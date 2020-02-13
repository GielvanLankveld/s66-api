import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repo } from './repository';
import { spawn } from 'child_process';
import { JobEntity } from 'src/database/entities/job.entity';
import { ApiException } from 'src/exceptions/api.exception';
import { JobStatus } from 'src/database/enums/jobstatus';
import { RUN_QUEUE } from 'src/constants';
import { RunJob } from 'src/jobs/run.job';
import { Queue } from 'bull';
import { DataLoaderEntity } from 'src/database/entities/dataloader.entity';
import path = require('path');
import { SchemeBuilderService } from './scheme-builder';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(DataLoaderEntity)
    private readonly dataloaderRepository: Repository<DataLoaderEntity>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    @Inject(RUN_QUEUE)
    private readonly runQueue: Queue<RunJob>,
    private readonly schemeBuilder: SchemeBuilderService,
  ) {
    runQueue.process(async ({ data: { jobId } }, done) => {
      const job = await this.jobRepository.findOne({
        where: {
          id: jobId,
        },
        relations: [
          'dataloader',
          'dataloader.branch',
          'dataloader.branch.repository',
        ],
      });

      const {
        dataloader: {
          branch: { repository, name: branchName },
        },
      } = job;

      await this.setJobStatus(job.id, JobStatus.RUNNING);

      const repo = new Repo(repository.url);

      try {
        await repo.clone(branchName);
      } catch (e) {
        throw new ApiException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          'error while cloning repo',
        );
      }

      const schemas = await schemeBuilder.validateScheme(
        path.join(repo.dir, 'scheme.json'),
      );

      console.log('schemas', schemas);

      try {
        await this.build(repo.dir, job);
        await this.setJobStatus(job.id, JobStatus.SUCCESS);
      } catch (e) {
        await this.setJobStatus(job.id, JobStatus.FAILED);
      } finally {
        await this.setJobEndDate(job.id, new Date());
      }

      done();
    });
  }

  async get(jobId: number): Promise<JobEntity> {
    return await this.jobRepository.findOne({ id: jobId });
  }

  async run(dataLoaderId: number): Promise<JobEntity> {
    const dataloader = await this.dataloaderRepository.findOne({
      where: {
        id: dataLoaderId,
      },
    });

    const job = new JobEntity();
    job.logs = '';
    job.dataloaderId = dataloader.id;
    job.status = JobStatus.PENDING;
    await this.jobRepository.save(job);
    await this.runQueue.add({ jobId: job.id });

    return job;
  }

  private async setJobStatus(jobId: number, jobStatus: JobStatus) {
    await this.jobRepository
      .createQueryBuilder('job')
      .update()
      .set({ status: jobStatus })
      .where('job.id = :jobId', { jobId })
      .execute();
  }

  private async setJobEndDate(jobId: number, date: Date) {
    await this.jobRepository
      .createQueryBuilder('job')
      .update()
      .set({ endTime: date })
      .where('job.id = :jobId', { jobId })
      .execute();
  }

  private async build(repoDir: string, job: JobEntity) {
    const {
      dataloader: {
        name: dataloaderName,
        branch: { repository, name: branchName },
      },
    } = job;

    const build = spawn(
      'docker',
      ['build', '-t', `project_${repository.projectId}_${branchName}`, '.'],
      {
        cwd: path.join(repoDir, dataloaderName),
      },
    );

    let logs = '';
    build.stdout.on('data', data => {
      logs += data;
    });

    build.stderr.on('data', data => {
      logs += data;
    });

    const interval = setInterval(async () => {
      await this.jobRepository.query(
        `update job set logs = concat(?,logs) where id = ?`,
        [logs, job.id],
      );
      logs = '';
    }, 1000);

    await new Promise((resolve, reject) => {
      build.on('close', async code => {
        clearInterval(interval);
        await this.jobRepository.query(
          `update job set logs = concat(?,logs) where id = ?`,
          [logs, job.id],
        );
        logs = '';
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }
}
