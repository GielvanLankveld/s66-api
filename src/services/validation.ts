import { ApiException } from './../exceptions/api.exception';
import { plainToClass } from 'class-transformer';
import { Injectable, HttpStatus } from '@nestjs/common';
import { validate } from 'class-validator';
@Injectable()
export class ValidationService {
  constructor() {}

  async validate<T = any>(
    clazz: { new (): T },
    configFileData: string,
  ): Promise<T> {
    let target: T;
    try {
      target = plainToClass(clazz, JSON.parse(configFileData));
    } catch (e) {
      throw ['invalid json'];
    }

    let errors = await validate(target);

    errors = errors.reduce((result, e) => {
      result.push(...Object.keys(e.constraints).map(key => e.constraints[key]));
      return result;
    }, []);

    if (errors.length) {
      throw errors;
    }

    return target;
  }
}
