import { DataSource } from 'typeorm';
import { Category } from './entities/Category';

export const AppDataSource = new DataSource({
  type: 'mysql', // or 'postgres', 'sqlite', etc.
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'db_wiki_dev',
  // synchronize: true,
  // logging: true,
  entities: [Category]
});
