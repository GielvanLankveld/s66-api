import { EntitySchema } from "typeorm";
import { Injectable } from "@nestjs/common";
import { Scheme } from "src/models/scheme";

@Injectable()
export class SchemeBuilderService {

    generateScheme(scheme: Scheme) {
        console.log(scheme);
        const RepoEntity = new EntitySchema(scheme);
        console.log(RepoEntity);
    }
}