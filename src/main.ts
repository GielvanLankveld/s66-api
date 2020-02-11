import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Make sure unhandled promise rejections crash the application
process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
