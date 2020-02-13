import { IsString, IsDefined, IsIn } from 'class-validator';

export class DataloaderConfig {
  @IsDefined()
  @IsString()
  @IsIn(['json', 'csv'])
  outputDataType: string;
}
