import {MigrationInterface, QueryRunner} from "typeorm";

export class AddBranchError1581548495214 implements MigrationInterface {
    name = 'AddBranchError1581548495214'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `branch` ADD `error` text NOT NULL", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `branch` DROP COLUMN `error`", undefined);
    }

}
