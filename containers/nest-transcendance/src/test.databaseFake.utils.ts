import { DataType, IBackup, IMemoryDb, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import entities from './typeorm';
import { Module } from '@nestjs/common';

export class TestDatabase {
  private backup: IBackup;
  constructor(public dataSource: DataSource, public dataBase: IMemoryDb) {
    this.backup = dataBase.backup();
  }

  reset() {
    this.backup.restore();
  }
}

export const setupDataSource = async () => {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  db.public.registerFunction({
    implementation: () => 'test',
    name: 'current_database',
  });

  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: v4,
      impure: true,
    });
  });

  db.public.registerFunction({
    name: 'version',
    implementation: () =>
      'PostgreSQL 14.2, compiled by Visual C++ build 1914, 64-bit',
  });

  const conf: TypeOrmModuleOptions & PostgresConnectionOptions = {
    type: 'postgres',
    entities: entities,
    synchronize: false,
  };
  const ds: DataSource = await db.adapters.createTypeormDataSource(conf);
  await ds.initialize();
  await ds.synchronize();

  return new TestDatabase(ds, db);
};

export function disableRealDatabaseConnection() {
  return () => {
    const original = jest.requireActual('@nestjs/typeorm');
    original.TypeOrmModule.forRoot = jest
      .fn()
      .mockImplementation(({}) => fakeForRoot);

    @Module({})
    class fakeForRoot {
    }

    return {
      ...original
    };
  };
}