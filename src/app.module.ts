import { Module } from '@nestjs/common';
import { RepositoryController } from './controllers/repository.controller';

@Module({
  imports: [],
  controllers: [RepositoryController],
  providers: [],
})
export class AppModule {}
