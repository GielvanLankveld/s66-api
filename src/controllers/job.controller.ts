import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { JobService } from 'src/services/job';

@Controller('/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('/:id')
  async getJob(@Param('id', ParseIntPipe) jobId: number) {
    const job = await this.jobService.get(jobId);
    return { success: true, data: job };
  }

  @Post('/run')
  async run(@Body() body: { dataloaderId: number }) {
    const job = await this.jobService.run(body.dataloaderId);
    return { success: true, data: job };
  }
}
