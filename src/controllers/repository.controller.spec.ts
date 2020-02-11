import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryController } from './repository.controller';

describe('RepositoryController', () => {
  let repositoryController: RepositoryController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [RepositoryController],
      providers: [],
    }).compile();

    repositoryController = app.get<RepositoryController>(RepositoryController);
  });

  // describe('root', () => {
  //   it('should return "Hello World!"', () => {
  //     expect(appController.getHello()).toBe('Hello World!');
  //   });
  // });
});
