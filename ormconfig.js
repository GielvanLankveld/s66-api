module.exports = {
  type: 'mysql',
  database: 's66',
  host: 'localhost',
  username: 'root',
  password: 's66project',
  timezone: 'UTC',
  connectTimeout: 2000,
  entities: ['src/database/entities/**/**.ts'],
  migrations: ['src/database/migrations/**/**.ts'],
  cli: {
    migrationsDir: 'src/database/migrations',
  },
};
