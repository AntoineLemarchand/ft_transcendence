import { Test } from '@nestjs/testing';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';
import { User } from '../user/user.entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { setupDataSource } from '../test.databaseFake.utils';
import { Channel } from '../channel/channel.entities';
import { ChannelService } from '../channel/channel.service';
import { UserRepository } from '../channel/channel.repository.mock';
import { UserService } from './user.service';
import { ChannelModule } from '../channel/channel.module';
import { INestApplication } from '@nestjs/common';

jest.spyOn(Channel.prototype, 'addMessage');
jest.spyOn(BroadcastingGateway.prototype, 'emitMessage');
jest.mock('../broadcasting/broadcasting.gateway');

let channelService: ChannelService;
let userRepository: Repository<User>;
let broadcasting: BroadcastingGateway;
let userService: UserService;
let dataSource: DataSource;
let app: INestApplication;

beforeEach(async () => {
  dataSource = await setupDataSource();
  const module = await Test.createTestingModule({
    imports: [ChannelModule],
  })
    .overrideProvider(getRepositoryToken(User))
    .useValue(dataSource.getRepository(User))
    .compile();
  app = module.createNestApplication();
  channelService = app.get<ChannelService>(ChannelService);
  broadcasting = app.get<BroadcastingGateway>(BroadcastingGateway);
  userService = app.get<UserService>(UserService);
  userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  await app.init();
});

describe('creating a user', () => {
  it('should increase the user count', async () => {
    const countBefore = (await userService.getAllUsernames()).length;

    await userService.createUser(new User('newUserName', 'newUserPassword'));

    const countAfter = (await userService.getAllUsernames()).length;
    expect(countAfter).toEqual(countBefore + 1);
  });
});
