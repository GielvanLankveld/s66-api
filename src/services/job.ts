import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryEntity } from 'src/database/entities/repository.entity';
import { Repository } from 'typeorm';
import { BranchEntity } from 'src/database/entities/branch.entity';
import { Repo } from './repository';
import { spawn } from 'child_process';
import { JobEntity } from 'src/database/entities/job.entity';
import { ApiException } from 'src/exceptions/api.exception';
import { JobStatus } from 'src/database/enums/jobstatus';
import { JobStep } from 'src/database/enums/jobStep';
import { RUN_QUEUE } from 'src/constants';
import { RunJob } from 'src/jobs/run.job';
import { Queue } from 'bull';
import { DataLoaderEntity } from 'src/database/entities/dataloader.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(DataLoaderEntity)
    private readonly dataloaderRepository: Repository<DataLoaderEntity>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    @Inject(RUN_QUEUE)
    private readonly runQueue: Queue<RunJob>,
  ) {
    runQueue.process(async ({ data: { jobId } }, done) => {
      await this.build(jobId);
      done();
    });
  }

  async run(dataLoaderId: number) {
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
  }

  private async build(jobId: number) {
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

    const repo = new Repo(repository.url);

    try {
      await repo.clone(branchName);
    } catch (e) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'error while cloning repo',
      );
    }

    const build = spawn(
      'docker',
      ['build', '-t', `project_${repository.projectId}_${branchName}`, '.'],
      {
        cwd: repo.dir,
      },
    );

    let logs = '';
    build.stdout.on('data', data => {
      logs += data;
    });

    const interval = setInterval(async () => {}, 1000);

    build.on('close', code => {
      clearInterval(interval);
      console.log('done with code', code);
    });
  }
}
