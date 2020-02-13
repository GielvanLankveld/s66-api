import { Controller, Post, Body } from '@nestjs/common';
import { JobService } from 'src/services/job';

@Controller('/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('/run')
  async run(@Body() body: { dataloaderId: number }) {
    await this.jobService.run(body.dataloaderId);
    return { success: true, message: 'dataloader is build' };
  }
}
