import { EntitySchema, Connection, createConnection } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EntitySchemaOptions } from 'typeorm/entity-schema/EntitySchemaOptions';

@Injectable()
export class SchemeBuilderService {
    constructor(private readonly connection: Connection) {}

    async generateScheme(scheme: EntitySchemaOptions<any>, databaseName: string) {
        console.log(scheme);
        const entitySchema = new EntitySchema(scheme);

        this.connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${databaseName}\``,
        );

        const dataConnection = await createConnection({
            name: databaseName,
            type: 'mysql',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: databaseName,
            entities: [entitySchema],
            synchronize: false,
        });

        const databaseLog = await dataConnection.driver
            .createSchemaBuilder()
            .log();

        const queries = databaseLog.upQueries.map(q => q.query);

        await dataConnection.transaction(async entityManager => {
            for (const query of queries) {
                await entityManager.query(query);
            }
        });

        await dataConnection.close();
    }
}
