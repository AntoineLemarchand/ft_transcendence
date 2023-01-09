import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './typeorm';

export async function createTestModule(dataSource: DataSource) {
  const module = await Test.createTestingModule({
    imports: [AppModule]
  })
    .overrideProvider(getRepositoryToken(User))
    .useValue(dataSource.getRepository(User))
    .compile();
  return module.createNestApplication();
}