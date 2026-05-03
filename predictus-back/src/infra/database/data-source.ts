import 'dotenv/config';
import { DataSource } from 'typeorm';

export const dataSourceOptions = {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/infra/database/migrations/*.js'],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(dataSourceOptions);