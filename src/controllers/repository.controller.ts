import { Controller, Post, Body } from '@nestjs/common';
import * as simplegit from 'simple-git/promise';
import { promisify } from 'util';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';
import * as Rimraf from 'rimraf';
import { validate } from 'class-validator';
import { Config } from 'src/models/config';
import { DataLoaderConfig } from 'src/models/dataLoader'
import { SchemeBuilderService } from 'src/services/scheme-builder';
import { EntitySchemaOptions } from 'typeorm/entity-schema/EntitySchemaOptions';
import { ValidationService } from 'src/services/validationService';
const fsExists = promisify(fs.exists);
const tmpDir = promisify(tmp.dir);
const rimraf = promisify(Rimraf);
const readFile = promisify(fs.readFile);

@Controller('/repository')
export class RepositoryController {
  constructor(private readonly schemeBuilder: SchemeBuilderService, private readonly validationService: ValidationService) { }

  @Post()
  async runRepository(@Body() body: { url: string; branch?: string }) {
    const dir = await tmpDir();
    const git = simplegit();

    try {
      await git.clone(body.url, dir);

      await git.cwd(dir);

      if (!!body.branch) {
        await git.checkout(body.branch);
      }

      const configPath = path.join(dir, 'config.json');

      const configExists = await fsExists(configPath);

      if (!configExists) {
        return { success: false, message: 'config.json does not exist' };
      }

      const schemePath = path.join(dir, 'scheme.json');

      const schemeExists = await fsExists(schemePath);

      if (!schemeExists) {
        return { success: false, message: 'scheme.json does not exist' };
      }

      const configFile = await readFile(configPath, 'utf8');
      const schemeFile = await readFile(schemePath, 'utf8');

      let config: Config
      let scheme: EntitySchemaOptions<any>;

      try {
        config = await this.validationService.validate(Config, configFile)
      } catch (e) {
        return { success: false, errors: e }
      }

      if(config.dataLoaders) {
        //MULTIPLE DATALOADERS
      } else {
        //SINGLE DATALOADER
      }

      let errors: string[]
      let dataLoaderConfigs: DataLoaderConfig[] = []

      config.dataLoaders.forEach(async dataLoader => {
        console.log('looping over dataloader: ', dataLoader)

        const dataLoaderPath = path.join(dir, dataLoader);
        const dataLoaderConfigPath = path.join(
          dataLoaderPath,
          'dataloader.config.json',
        );

        let dataLoaderConfigFile;

        try {
          dataLoaderConfigFile = await readFile(dataLoaderConfigPath, 'utf8');
        } catch (error) {
          errors.push(`Failed to get the dataloader config.json file for ${dataLoader}`);
        }

        console.log('read dataloaderconfig file')

        if (dataLoaderConfigFile) {
          let dataLoaderConfig: DataLoaderConfig
          try {
            dataLoaderConfig = await this.validationService.validate(DataLoaderConfig, dataLoaderConfigFile);
            dataLoaderConfigs.push(dataLoaderConfig);
          } catch (e) {
            errors = [...errors, ...e]
          }

          console.log('validated dataloaderconfig file')

          //TODO Uitlezen van dataloader
        }
      });

      //this.schemeBuilder.generateScheme(scheme, 'dbName');

      return { success: true, config, dataLoaderConfigs };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: e.message,
      };
    } finally {
      await rimraf(dir);
    }
  }
}
