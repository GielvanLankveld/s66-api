import { Module } from '@nestjs/common';
import { RepositoryController } from './controllers/repository.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './database/entities/project.entity';
import { SchemeBuilderService } from './services/scheme-builder';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [ProjectEntity],
    }),
  ],
  controllers: [RepositoryController],
  providers: [SchemeBuilderService],
})
export class AppModule {}
