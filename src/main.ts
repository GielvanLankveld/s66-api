import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'typeorm';

// Make sure unhandled promise rejections crash the application
process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const connection = await app.resolve(Connection);

  const pendingMigrations = await connection.showMigrations();

  if (pendingMigrations) {
    console.log('running migrations...');
    await connection.runMigrations({ transaction: 'each' });
  }

  await app.listen(3000);

  process.on('SIGTERM', async () => {
    await shutdownApp(app);
  });

  process.on('SIGINT', async () => {
    await shutdownApp(app);
  });
}

async function shutdownApp(app: any) {
  app
    .close()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

bootstrap().then(() => {
  if (process.send) {
    process.send('ready');
  }
});
