import { MigrationInterface, QueryRunner } from 'typeorm';

export class Project1581496237369 implements MigrationInterface {
  name = 'Project1581496237369';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      'CREATE TABLE `project` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB',
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query('DROP TABLE `project`', undefined);
  }
}
