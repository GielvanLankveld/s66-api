import { IsString, IsDefined, IsObject } from 'class-validator';

export class Scheme {
  @IsDefined()
  @IsString()
  name: string;

  @IsDefined()
  @IsObject()
  columns: object;
}
