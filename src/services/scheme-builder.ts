import { EntitySchema, Connection, createConnection } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EntitySchemaOptions } from 'typeorm/entity-schema/EntitySchemaOptions';
const readFile = promisify(fs.readFile);

@Injectable()
export class SchemeBuilderService {
    constructor(private readonly connection: Connection) {}

    validateScheme(schemePath: string): EntitySchemaOptions<any>[] {
        const schemeFile = readFile(schemePath, 'utf8');
        let schemes: [EntitySchemaOptions<any>];

        try {
          schemes = JSON.parse(schemeFile);
        } catch (e) {
          throw 'schema.json file is invalid JSON';
        }

        return schemes;
    }

    async generateScheme(schemas: [EntitySchemaOptions<any>], databaseName: string) {
        console.log(schemas);
        const entitySchemas: EntitySchema[] = [];
        schemas.forEach(schema => {
            entitySchemas.push(new EntitySchema(schema));
        });

        if(schemas.length <= 0) {
            throw 'no schemas found.';
        }

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
            entities: entitySchemas,
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
