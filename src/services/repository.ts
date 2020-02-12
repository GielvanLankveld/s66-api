import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryEntity } from 'src/database/entities/repository.entity';
import { Repository } from 'typeorm';
import { BranchEntity } from 'src/database/entities/branch.entity';
import * as simplegit from 'simple-git/promise';
import { promisify } from 'util';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as path from 'path';
import * as Rimraf from 'rimraf';
import { AddRepositoryDto } from 'src/dtos/addRepository.dto';
import { BranchStatus } from 'src/database/enums/branchStatus';
import { BRANCH_QUEUE } from 'src/constants';
import { Queue } from 'bull';
import { BranchJob } from 'src/jobs/branch.job';
import { STATUS_CODES } from 'http';

const fsExists = promisify(fs.exists);
const tmpDir = promisify(tmp.dir);
const rimraf = promisify(Rimraf);

export interface RepoBranch {
  commitCount: number;
}

export class Repo {
  public dir: string | null = null;
  private git = simplegit();
  constructor(public readonly url: string) { }

  async clone(branchName?: string) {
    try {
      this.dir = await tmpDir();

      await this.git.clone(this.url, this.dir, !!branchName ? ['-b', branchName] : []);

      await this.git.cwd(this.dir);
    } catch (e) {
      await this.delete();
    }
  }

  async branches(): Promise<string[]> {
    const summary = await this.git.branch(['-r']);

    return summary.all.map(name => name.replace('origin/', ''));
  }

  async branch(branchName: string): Promise<RepoBranch> {
    await this.git.checkout(branchName);

    const commitCount = await this.git.raw(['rev-list', '--count', branchName]);

    return {
      commitCount: parseInt(commitCount.trim(), 10),
    };
  }

  async delete() {
    await rimraf(this.dir);
  }
}

@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repositoryRepository: Repository<RepositoryEntity>,
    @InjectRepository(BranchEntity)
    private readonly branchRepository: Repository<BranchEntity>,
    @Inject(BRANCH_QUEUE)
    private readonly branchQueue: Queue<BranchJob>,
  ) {
    branchQueue.process(async ({ data: { branchId, repositoryId } }, done) => {
      const branch = await this.branchRepository.findOne({
        where: { id: branchId, repositoryId },
        relations: ['repository'],
      });

      branch.status = BranchStatus.VALIDATING;
      await branch.save();

      const branchRepo = new Repo(branch.repository.url);

      await branchRepo.clone(branch.name);
      //Validate branch
      //Files uitlezen + valideren

      const configPath = path.join(branchRepo.dir, 'config.json');

      const configExists = await fsExists(configPath);

      if (!configExists) {
        branch.error = 'scheme.json does not exist';
        branch.status = BranchStatus.FAILED;
        await branch.save();
        return done(Error('scheme.json does not exist'));
      }

      console.log(branch);

      branch.status = BranchStatus.SUCCESS;
      await branch.save();

      setTimeout(() => {
        done();
      }, 2000);
    });
  }

  async create(addRepositoryDto: AddRepositoryDto): Promise<RepositoryEntity> {
    const { url, projectId } = addRepositoryDto;

    const repo = new Repo(url);

    await repo.clone();
    const branchNames = await repo.branches();

    const repository = new RepositoryEntity();
    repository.url = url;
    repository.projectId = projectId;

    await this.repositoryRepository.save(repository);

    for (const branchName of branchNames) {
      const { commitCount } = await repo.branch(branchName);

      const branch = new BranchEntity();
      branch.name = branchName;
      branch.repositoryId = repository.id;
      branch.status = BranchStatus.PENDING;
      branch.commits = commitCount;
      branch.error = '';

      await this.branchRepository.save(branch);

      await this.branchQueue.add({
        branchId: branch.id,
        repositoryId: repository.id,
      });
    }

    return repository;
  }
}
