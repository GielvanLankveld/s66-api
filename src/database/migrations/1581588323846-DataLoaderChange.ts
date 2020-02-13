import { MigrationInterface, QueryRunner } from 'typeorm';

export class DataLoaderChange1581588323846 implements MigrationInterface {
  name = 'DataLoaderChange1581588323846';

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `dataloader` ADD `status` enum ('SUCCESS', 'FAILED') NOT NULL",
      undefined,
    );
    await queryRunner.query(
      "ALTER TABLE `job` CHANGE `step` `step` enum ('VALIDATING_CONFIG', 'DOWNLOADING', 'VALIDATING_DATA', 'IMPORTING', 'FINISHED') NULL",
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "ALTER TABLE `job` CHANGE `step` `step` enum ('VALIDATING_CONFIG', 'DOWNLOADING', 'VALIDATING_DATA', 'IMPORTING', 'FINISHED') NOT NULL",
      undefined,
    );
    await queryRunner.query(
      'ALTER TABLE `dataloader` DROP COLUMN `status`',
      undefined,
    );
  }
}
