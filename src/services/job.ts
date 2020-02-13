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
import { Config } from 'src/models/config';
import { JobStep } from 'src/database/enums/jobStep';
import * as k8s from '@kubernetes/client-node';
import * as fs from 'fs';
import generate from 'nanoid/async/generate';
import { promisify } from 'util';
import csvtojson from 'csvtojson';

const kc = new k8s.KubeConfig();
kc.loadFromCluster();

const readFile = promisify(fs.readFile);

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

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
      await this.setJobStep(job.id, JobStep.DOWNLOADING);

      try {
        const repo = new Repo(repository.url);

        try {
          await this.appendLogs(job.id, 'DOWNLOADING REPOSITORY...\n');
          await repo.clone(branchName);
          await this.appendLogs(job.id, 'FINISHED DOWNLOADING REPOSITORY\n');
        } catch (e) {
          throw new ApiException(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'error while cloning repo',
          );
        }

        await this.appendLogs(job.id, 'VALIDATING SCHEMA...\n');
        const schemas = await this.schemeBuilder.validateScheme(
          path.join(repo.dir, 'scheme.json'),
        );
        await this.appendLogs(job.id, 'FINISHED VALIDATING SCHEMA\n');

        await this.appendLogs(job.id, 'GENERATING DATABASE SCHEMA...\n');
        const { connection, entites } = await this.schemeBuilder.generateScheme(
          schemas,
          'test',
        );
        await this.appendLogs(job.id, 'FINISHED GENERATING DATABASE SCHEMA\n');

        await this.appendLogs(job.id, 'BUILDING DATALOADER...\n');
        const imageName = await this.build(repo.dir, job);
        await this.appendLogs(job.id, 'FINISHED BUILDING DATALOARDER\n');

        const outputPath = `/api/data/job_${job.id}`;

        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath);
        }

        await this.appendLogs(job.id, 'STARTING DATALOADER...\n');
        const podName = `job-${await generate('1234567890abcdef', 10)}`;
        await k8sApi.createNamespacedPod('default', {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: {
            name: podName,
          },
          spec: {
            containers: [
              {
                name: 'loader',
                image: imageName,
                imagePullPolicy: 'IfNotPresent',
                volumeMounts: [
                  {
                    name: 'api-storage',
                    mountPath: '/api/data',
                  },
                ],
                env: [
                  {
                    name: 'DATA_LOADER_OUTPUT',
                    value: outputPath,
                  },
                ],
              },
            ],
            restartPolicy: 'Never',
            volumes: [
              {
                name: 'api-storage',
                persistentVolumeClaim: {
                  claimName: 'api-pv-claim',
                },
              },
            ],
          },
        });
        await this.appendLogs(job.id, 'WAITING FOR DATALOADER TO FINISH...\n');
        await this.waitForPod(podName);
        await this.appendLogs(job.id, 'DATALOADER FINISHED\n');

        await this.appendLogs(job.id, 'FETCHING DATA...\n');
        const data = await csvtojson().fromFile(
          path.join(outputPath, 'user.csv'),
        );
        await this.appendLogs(job.id, 'DATA FETCHED FROM DATALOADER\n');

        const [userEntity] = entites;

        await this.appendLogs(job.id, 'WRITING TO DATABASE\n');
        for (const item of data) {
          await connection.getRepository(userEntity).insert(item);
        }

        await this.appendLogs(job.id, 'FINISHED WRITING DATA TO DATABASE\n');
        await connection.close();

        await this.deletePod(podName);

        await this.setJobStatus(job.id, JobStatus.SUCCESS);
        await this.appendLogs(job.id, 'FINISHED JOB\n');
      } catch (e) {
        console.log(e);
        await this.setJobStatus(job.id, JobStatus.FAILED);
      } finally {
        await this.setJobStep(job.id, JobStep.FINISHED);
        await this.setJobEndDate(job.id, new Date());
      }

      done();
    });
  }

  async get(jobId: number): Promise<JobEntity> {
    return await this.jobRepository.findOne({ id: jobId });
  }

  async waitForPod(podName: string) {
    let done = false;

    while (!done) {
      const { body } = await k8sApi.readNamespacedPodStatus(podName, 'default');

      if (
        body.status &&
        body.status.containerStatuses &&
        body.status.containerStatuses.length > 0
      ) {
        const status = body.status.containerStatuses.find(
          cs => cs.name === 'loader',
        );

        if (status && status.state && status.state.terminated) {
          done = true;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  async deletePod(podName: string) {
    await k8sApi.deleteNamespacedPod(podName, 'default');
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

  private async setJobStep(jobId: number, jobStep: JobStep) {
    await this.jobRepository
      .createQueryBuilder('job')
      .update()
      .set({ step: jobStep })
      .where('job.id = :jobId', { jobId })
      .execute();
  }

  private async appendLogs(jobId: number, logs: string) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.jobRepository.query(
      `update job set logs = concat(logs, ?) where id = ?`,
      [logs, jobId],
    );
  }

  private async setJobEndDate(jobId: number, date: Date) {
    await this.jobRepository
      .createQueryBuilder('job')
      .update()
      .set({ endTime: date })
      .where('job.id = :jobId', { jobId })
      .execute();
  }

  private async build(repoDir: string, job: JobEntity): Promise<string> {
    const {
      dataloader: {
        name: dataloaderName,
        branch: { repository, name: branchName },
      },
    } = job;

    const imageName = `project_${repository.projectId}_${branchName}`;
    const build = spawn('docker', ['build', '-t', imageName, '.'], {
      cwd: path.join(repoDir, dataloaderName),
    });

    let logs = '';
    build.stdout.on('data', data => {
      logs += data;
    });

    build.stderr.on('data', data => {
      logs += data;
    });

    const interval = setInterval(async () => {
      await this.jobRepository.query(
        `update job set logs = concat(logs, ?) where id = ?`,
        [logs, job.id],
      );
      logs = '';
    }, 1000);

    return await new Promise<string>((resolve, reject) => {
      build.on('close', async code => {
        clearInterval(interval);
        await this.jobRepository.query(
          `update job set logs = concat(logs, ?) where id = ?`,
          [logs, job.id],
        );
        logs = '';
        if (code === 0) {
          resolve(imageName);
        } else {
          reject();
        }
      });
    });
  }
}
