import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RepositoryEntity } from 'src/database/entities/repository.entity';
import { Repository } from 'typeorm';
import { BranchEntity } from 'src/database/entities/branch.entity';
import * as simplegit from 'simple-git/promise';
import { promisify } from 'util';
import * as tmp from 'tmp';
import * as Rimraf from 'rimraf';
import { AddRepositoryDto } from 'src/dtos/addRepository.dto';
import { BranchStatus } from 'src/database/enums/branchStatus';
import { BRANCH_QUEUE } from 'src/constants';
import { Queue } from 'bull';
import { BranchJob } from 'src/jobs/branch.job';

const tmpDir = promisify(tmp.dir);
const rimraf = promisify(Rimraf);

export interface RepoBranch {
  commitCount: number;
}

export class Repo {
  private dir: string | null = null;
  private git = simplegit();
  constructor(public readonly url: string) {}

  async clone() {
    try {
      this.dir = await tmpDir();

      await this.git.clone(this.url, this.dir);

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

      console.log(branch);

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

      await this.branchRepository.save(branch);

      await this.branchQueue.add({
        branchId: branch.id,
        repositoryId: repository.id,
      });
    }

    return repository;
  }
}
