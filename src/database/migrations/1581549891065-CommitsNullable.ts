import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommitsNullable1581549891065 implements MigrationInterface {
  name = 'CommitsNullable1581549891065';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      'ALTER TABLE `branch` CHANGE `commits` `commits` int NULL',
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      'ALTER TABLE `branch` CHANGE `commits` `commits` int NOT NULL',
      undefined,
    );
  }
}
