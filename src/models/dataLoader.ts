import { IsString, IsDefined, IsIn } from "class-validator";

export class DataLoaderConfig {
    @IsString()
    @IsDefined()
    @IsIn(["txt", "json", "sql", "csv"])
    outputDataType: string

    @IsDefined()
    @IsString()
    outputPath: string

    @IsDefined()
    @IsString()
    version: string

    @IsDefined()
    @IsString()
    name: string
}