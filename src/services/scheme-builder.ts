import { EntitySchema } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Scheme } from 'src/models/scheme';

@Injectable()
export class SchemeBuilderService {
  generateScheme(scheme: Scheme) {
    console.log(scheme);
    return new EntitySchema(scheme);
  }
}
