import {
  IsDefined,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsString,
} from 'class-validator';

export class Config {
  @IsString()
  @IsDefined()
  database: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  dataLoaders: string[];
}
