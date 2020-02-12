import {MigrationInterface, QueryRunner} from "typeorm";

export class InitialDatabase1581534216930 implements MigrationInterface {
    name = 'InitialDatabase1581534216930'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `project` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `repository` (`id` int NOT NULL AUTO_INCREMENT, `url` varchar(3000) NOT NULL, `project_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `job` (`id` int NOT NULL AUTO_INCREMENT, `startTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, `endTime` timestamp NULL, `status` enum ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED') NOT NULL, `step` enum ('VALIDATING_CONFIG', 'DOWNLOADING', 'VALIDATING_DATA', 'IMPORTING', 'FINISHED') NOT NULL, `logs` text NOT NULL, `dataloader_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `dataloader` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `branch_id` int NOT NULL, `project_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `branch` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(1000) NOT NULL, `status` enum ('PENDING', 'VALIDATING', 'SUCCESS', 'FAILED') NOT NULL, `commits` int NOT NULL, `repository_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `repository` ADD CONSTRAINT `FK_7b840cd81fa4633b9d8a27ed887` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `job` ADD CONSTRAINT `FK_63852504246f84387e544162036` FOREIGN KEY (`dataloader_id`) REFERENCES `dataloader`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `dataloader` ADD CONSTRAINT `FK_d9d1fbf23597517da996d4a514c` FOREIGN KEY (`branch_id`) REFERENCES `branch`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `dataloader` ADD CONSTRAINT `FK_6fa1068fc7ba46a66f5165ebef0` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `branch` ADD CONSTRAINT `FK_9bf4dc309fb4d0922356a45378e` FOREIGN KEY (`repository_id`) REFERENCES `repository`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER TABLE `branch` DROP FOREIGN KEY `FK_9bf4dc309fb4d0922356a45378e`", undefined);
        await queryRunner.query("ALTER TABLE `dataloader` DROP FOREIGN KEY `FK_6fa1068fc7ba46a66f5165ebef0`", undefined);
        await queryRunner.query("ALTER TABLE `dataloader` DROP FOREIGN KEY `FK_d9d1fbf23597517da996d4a514c`", undefined);
        await queryRunner.query("ALTER TABLE `job` DROP FOREIGN KEY `FK_63852504246f84387e544162036`", undefined);
        await queryRunner.query("ALTER TABLE `repository` DROP FOREIGN KEY `FK_7b840cd81fa4633b9d8a27ed887`", undefined);
        await queryRunner.query("DROP TABLE `branch`", undefined);
        await queryRunner.query("DROP TABLE `dataloader`", undefined);
        await queryRunner.query("DROP TABLE `job`", undefined);
        await queryRunner.query("DROP TABLE `repository`", undefined);
        await queryRunner.query("DROP TABLE `project`", undefined);
    }

}
