import { parse } from 'dotenv';
import { readFileSync } from 'fs';

export interface Environment {
  JWT_SECRET_PASSWORD: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

export const environment: Environment = parse(readFileSync('local.env')) as any;
