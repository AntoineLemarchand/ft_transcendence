import { Test } from '@nestjs/testing';
import { User } from './user.entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { setupDataSource, TestDatabase } from '../test.databaseFake.utils';
import { UserService } from './user.service';
import { ChannelModule } from '../channel/channel.module';
import { INestApplication } from '@nestjs/common';
import { Channel } from '../channel/channel.entities';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';

jest.spyOn(Channel.prototype, 'addMessage');
jest.spyOn(BroadcastingGateway.prototype, 'emitMessage');
jest.mock('../broadcasting/broadcasting.gateway');

let userService: UserService;
let app: INestApplication;
let dataSource: DataSource;
let testDataBase: TestDatabase;

beforeAll(async () => {
  testDataBase = await setupDataSource();
  dataSource = testDataBase.dataSource;
});

beforeEach(async () => {
  testDataBase.reset();
  const module = await Test.createTestingModule({
    imports: [ChannelModule],
  })
    .overrideProvider(getRepositoryToken(User))
    .useValue(dataSource.getRepository(User))
    .overrideProvider(getRepositoryToken(Channel))
    .useValue(dataSource.getRepository(Channel))
    .compile();
  app = module.createNestApplication();
  userService = app.get<UserService>(UserService);
  await app.init();
  await userService.createUser(new User('Thomas', 'test'));
});



describe('creating a user', () => {
  it('should increment the user count', async () => {
    const countBefore = (await userService.getAllUsernames()).length;

    await userService.createUser(new User('newUserName', 'newUserPassword'));

    const countAfter = (await userService.getAllUsernames()).length;
    expect(countAfter).toEqual(countBefore + 1);
  });
});

describe('deleting a user', () => {
  beforeEach(async () => {
    await userService.createUser(new User('newUserName', 'newUserPassword'));
  });

  it('should decrement the user count', async () => {
    const countBefore = (await userService.getAllUsernames()).length;

    await userService.deleteUser('newUserName');

    const countAfter = (await userService.getAllUsernames()).length;
    expect(countAfter).toEqual(countBefore - 1);
  });
});

describe('making friends', () => {
  beforeEach(async () => {
    await userService.createUser(new User('executing user', 'password'));
    await userService.createUser(new User('target user', 'password'));
  });

  it('should decrement the user count', async () => {
    await userService.addFriend('executing user', 'target user');

    const friends = (await userService.getUser('executing user'))?.friends;
    expect(friends?.includes('target user')).toBeTruthy();
  });
});

describe('getting users by name', () => {
  it('should return undefined on not found', async () => {
    await userService.createUser(new User('executing user', 'password'));

    const user = await userService.getUser('nonexisting user');
    expect(user).toBeUndefined();
  });

  it('should return user', async () => {
    await userService.createUser(new User('executing user', 'password'));

    const user = await userService.getUser('executing user');
    expect(user).toBeDefined();
  });
});