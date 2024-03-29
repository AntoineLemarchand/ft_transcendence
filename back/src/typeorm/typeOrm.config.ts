import { DataSource } from 'typeorm';
import entities, { Channel, User, GameStat } from './index';
import { initDataBase1673427329295 } from './migrations/1673427329295-initDataBase';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT as unknown as number,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  entities: [User, Channel, GameStat],
  migrations: [initDataBase1673427329295],
});
