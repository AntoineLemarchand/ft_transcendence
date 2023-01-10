import { Test } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import * as testUtils from '../test.request.utils';
import { AppModule } from '../app.module';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';
import { DataSource } from 'typeorm';
import { setupDataSource, TestDatabase } from '../test.databaseFake.utils';
import { User } from '../typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createTestModule } from '../test.module.utils';
import { UserService } from '../user/user.service';

jest.mock('../broadcasting/broadcasting.gateway');

jest.mock('@nestjs/typeorm', () => {
  const original = jest.requireActual('@nestjs/typeorm');
  original.TypeOrmModule.forRoot = jest
    .fn()
    .mockImplementation(({}) => fakeForRoot);
  @Module({})
  class fakeForRoot {}
  return {
    ...original,
  };
});

describe('AuthController', () => {
  let app: INestApplication;
  let userService: UserService;
  let dataSource: DataSource;
  let testDataBase: TestDatabase;

  beforeAll(async () => {
    testDataBase = await setupDataSource();
    dataSource = testDataBase.dataSource;
  });

  beforeEach(async () => {
    testDataBase.reset();
    app = await createTestModule(dataSource);
    await app.init();
    userService = app.get<UserService>(UserService);
    await userService.createUser(new User('Thomas', 'test'));
  });

  // LOGIN
  it('should return 401 on wrong password', async () => {
    return testUtils
      .loginUser(app, 'Thomas', 'wrong password')
      .then((response) => expect(response.status).toBe(401));
  });

  it('should return 401 on non existing userName', async () => {
    return testUtils
      .loginUser(app, 'non existing user', 'test')
      .then((response) => expect(response.status).toBe(401));
  });

  it('should return 201 and access token on successful login', async () => {
    return testUtils.loginUser(app, 'Thomas', 'test').then((response) => {
      expect(response.status).toBe(201);
      expect(response.body.access_token).toBeDefined();
    });
  });

  // SIGNIN
  it('should return 401 when creating an already existent user', async () => {
    return testUtils
      .signinUser(app, 'Thomas', 'test')
      .then((response) => expect(response.status).toBe(401));
  });

  it('should return 403 on underscore in username', async () => {
    return testUtils
      .signinUser(app, '_illegal_name', 'wrong password')
      .then((response) => expect(response.status).toBe(403));
  });

  it('should return 201 and a token when creating user', async () => {
    return testUtils.signinUser(app, 'JayDee', 'yeah').then((response) => {
      expect(response.status).toBe(201);
      expect(response.body.access_token).toBeDefined();
    });
  });

  it('should return a token on login of a newly created user', async () => {
    await testUtils.signinUser(app, 'JayDee', 'yeah');
    return testUtils.loginUser(app, 'JayDee', 'yeah').then((response) => {
      expect(response.status).toBe(201);
      expect(response.body.access_token).toBeDefined();
    });
  });

  it('should add the welcome channel to newly created user', async () => {
    await testUtils.signinUser(app, 'Ginette', 'camemb3rt');
    const jwt = await testUtils.getLoginToken(app, 'Ginette', 'camemb3rt');

    const result = await testUtils.getUserData(app, jwt, 'Ginette');

    expect(result.status).toBe(200);
    expect(result.body.userInfo).toBeDefined();
    expect(result.body.userInfo.channelNames[0]).toBe('welcome');
  });
});
