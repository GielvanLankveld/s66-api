import { HttpStatus } from '@nestjs/common';

export class ApiException {
  constructor(
    public readonly status: HttpStatus,
    public readonly message: string,
  ) {}
}
