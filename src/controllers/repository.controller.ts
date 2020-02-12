import { Controller, Post, Body } from '@nestjs/common';
import * as simplegit from 'simple-git/promise';
import { promisify } from 'util';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';
import * as Rimraf from 'rimraf';
import { validate } from 'class-validator';
import { Config } from 'src/models/config';

const fsExists = promisify(fs.exists);
const tmpDir = promisify(tmp.dir);
const rimraf = promisify(Rimraf);
const readFile = promisify(fs.readFile);

@Controller('/repository')
export class RepositoryController {
  @Post()
  async runRepository(@Body() body: { url: string; branch?: string }) {
    const errors = [];
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

      const configFile = await readFile(configPath, 'utf8');

      let config: any;

      try {
        config = JSON.parse(configFile);
      } catch (e) {
        return { succes: false, message: 'config.json file is invalid JSON' };
      }

      if (config.dataloaders.length < 1) {
        return {
          succes: false,
          message: 'no dataloaders were specified in config.json',
        };
      }

      config.dataloaders.forEach(async dataloader => {
        const dataLoaderPath = path.join(dir, dataloader);
        const dataLoaderConfigPath = path.join(
          dataLoaderPath,
          'dataloader.config.json',
        );

        let dataLoaderConfigFile;
        try {
          dataLoaderConfigFile = await readFile(dataLoaderConfigPath, 'utf8');
        } catch (error) {
          errors.push(
            `Failed to get the dataloader config.json file for ${dataloader}`,
          );
        }

        if (dataLoaderConfigFile) {
          let config;
          try {
            config = JSON.parse(dataLoaderConfigFile);
          } catch (error) {
            errors.push(
              `Failed to parse te dataloader config.json file for ${dataloader}`,
            );
          }

          // TODO Validate the dataloader config file
        }
      });
      return { success: true, config, errors };

      // Foreach elke dataloader.config.json
      // validate(config).then(errors => {
      //   if (errors.length > 0) {
      //     return { succes: false, message: errors };
      //   }
      // });
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: 'something went wrong while cloing your repo',
      };
    } finally {
      await rimraf(dir);
    }
  }
}
