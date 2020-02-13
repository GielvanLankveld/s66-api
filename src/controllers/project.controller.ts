import { Controller, Post, Body, Get, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ProjectEntity } from 'src/database/entities/project.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiException } from 'src/exceptions/api.exception';

@Controller('/project')
export class ProjectController {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  @Get()
  async projects() {
    const projects = await this.projectRepository.find({
      relations: ['repositories', 'dataloaders'],
    });

    return { success: true, data: projects };
  }

  @Post()
  async addProject(@Body() body: { name: string }) {
    const count = await this.projectRepository
      .createQueryBuilder('project')
      .where('LOWER(project.name) = :name', { name: body.name })
      .getCount();

    if (count > 0) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        `Project with name: "${body.name}" already exists.`,
      );
    }

    const project = new ProjectEntity();
    project.name = body.name;

    await this.projectRepository.save(project);

    return { success: true, data: project };
  }
}
