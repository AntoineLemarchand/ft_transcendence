import { INestApplication, Module } from '@nestjs/common';
import * as testUtils from '../test.request.utils';
import * as request from 'supertest';
import { Channel, ChannelType } from './channel.entities';
import { UserService } from '../user/user.service';
import { ChannelService } from './channel.service';
import { DataSource } from 'typeorm';
import { setupDataSource, TestDatabase } from '../test.databaseFake.utils';
import { createTestModule } from '../test.module.utils';
import { User } from '../user/user.entities';

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

let app: INestApplication;
let userService: UserService;
let channelService: ChannelService;
let dataSource: DataSource;
let testDataBase: TestDatabase;

beforeAll(async () => {
  testDataBase = await setupDataSource();
  dataSource = testDataBase.dataSource;
});
beforeEach(async () => {
  testDataBase.reset();
  app = await createTestModule(dataSource);
  userService = app.get<UserService>(UserService);
  channelService = app.get<ChannelService>(ChannelService);
  await app.init();
  await userService.createUser(new User('admin', 'admin'));
  await userService.createUser(new User('Thomas', 'test'));
});

describe('joining a channel', () => {
  it('should not be allowed to create a channel if the user is not logged in ', async () => {
    const result = await testUtils.joinChannel(
      app,
      'invalid token',
      'newChannelName',
      'default',
    );

    expect(result.status).toBe(401);
  });

  it('should return 201 and create a new channel if correct input is provided', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');

    const result = await testUtils.joinChannel(
      app,
      jwt,
      'newChannelName',
      'default',
    );

    expect(result.status).toBe(201);
    expect(
      await testUtils.doesChannelExist(app, jwt, 'newChannelName'),
    ).toBeTruthy();
  });

  it('should make nonempty password obligatory for others to join', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');
    await testUtils.createUserAndJoinToChannel(
      app,
      'lambdaUserName',
      'newChannelName',
      'channelPassword',
    );

    const result = await testUtils.joinChannel(app, jwt, 'newChannelName', '');

    expect(result.status).toBe(401);
  });

  it('should create a private Channel when joining first', async () => {
    const jwtCreator = await testUtils.getLoginToken(app, 'Thomas', 'test');
    await testUtils.joinChannel(
      app,
      jwtCreator,
      'privateChannel',
      '',
      ChannelType.Private,
    );
    const jwtJoiner = (await testUtils.signinUser(app, 'outsider', 'password'))
      .body.access_token;

    const result = await testUtils.joinChannel(
      app,
      jwtJoiner,
      'privateChannel',
      '',
    );

    expect(result.status).toBe(401);
  });

  it('should add people to private channels on invite', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');
    await testUtils.joinChannel(
      app,
      jwt,
      'privateChannel',
      '',
      ChannelType.Private,
    );
    await testUtils.signinUser(app, 'outsider', 'password');

    const result = await request(app.getHttpServer())
      .post('/channel/invite')
      .set('Authorization', 'Bearer ' + jwt)
      .send({
        channelName: 'privateChannel',
        username: 'outsider',
      });

    expect(result.status).toBe(201);
    expect(
      (await userService.getUser('outsider'))
        ?.getChannelNames()
        .includes('privateChannel'),
    ).toBeTruthy();
  });

  it('should return 401 when inviting people to private channels and not admin', async () => {
    const jwtCreator = await testUtils.getLoginToken(app, 'Thomas', 'test');
    await testUtils.joinChannel(
      app,
      jwtCreator,
      'privateChannel',
      '',
      ChannelType.Private,
    );
    const jwtJoiner = (await testUtils.signinUser(app, 'outsider', 'password'))
      .body.access_token;

    const result = await testUtils.joinChannel(
      app,
      jwtJoiner,
      'privateChannel',
      '',
    );

    expect(result.status).toBe(401);
  });

  it('should return the new channel on join', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');

    const result = await testUtils.joinChannel(
      app,
      jwt,
      'newChannelName',
      'default',
    );

    expect(result.status).toBe(201);
    expect(result.body.channel).toBeDefined();
  });

  it('should return 409 when already joined', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');

    await testUtils.joinChannel(app, jwt, 'newChannelName', 'default');
    const result = await testUtils.joinChannel(
      app,
      jwt,
      'newChannelName',
      'default',
    );

    expect(result.status).toBe(409);
  });
});

async function createDirectMessage(
  callerModule: INestApplication,
  jwt: string,
  targetUsername: string,
) {
  return request(callerModule.getHttpServer())
    .post('/channel/join')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      targetUsername: targetUsername,
      channelType: 'directMessage',
    });
}

describe('creating a direct message channel', () => {
  it('should call the creation function', async () => {
    const spy = jest.spyOn(channelService, 'createDirectMessageChannelFor');
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');
    await testUtils.signinUser(app, 'Receiver', 'password');

    await createDirectMessage(app, jwt, 'Receiver');

    expect(spy).toBeCalledWith('Thomas', 'Receiver');
  });
});

describe('retrieving a channel', () => {
  it('should return 404 on non existing channelName', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');

    await request(app.getHttpServer())
      .get('/channel/findOne/nonExistingChannelName')
      .set('Authorization', 'Bearer ' + jwt)
      .expect((response) => {
        expect(response.status).toBe(404);
      });
  });

  it('should return the channel matching the request', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');

    const result: Channel = (await testUtils.getChannelByName(
      app,
      jwt,
      'welcome',
    )) as Channel;

    expect(result.getName()).toBe('welcome');
  });
});

describe('searching channels by name', () => {
  it('should return a list of channel names', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');
    await testUtils.joinChannel(app, jwt, 'newChannelName1', 'default');
    await testUtils.joinChannel(app, jwt, 'newChannelName2', 'default');
    await testUtils.joinChannel(app, jwt, 'otherChannelName1', 'default');

    const matchingChannels = await testUtils.getMatchingChannelNames(
      app,
      jwt,
      'new',
    );

    expect(matchingChannels.length).toBe(2);
    expect(matchingChannels[0]).toBe('newChannelName1');
    expect(matchingChannels[1]).toBe('newChannelName2');
  });

  it('should return the names of all joined channels', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');
    await testUtils.joinChannel(app, jwt, 'newChannelName1', 'default');
    await testUtils.joinChannel(app, jwt, 'newChannelName2', 'default');
    await testUtils.joinChannel(app, jwt, 'otherChannelName1', 'default');

    const matchingChannels = await testUtils.getMatchingChannelNames(
      app,
      jwt,
      '',
    );

    expect(matchingChannels.length).toEqual(
      (await channelService.getChannels()).length,
    );
  });
});

describe('administrating a channel', () => {
  it('should return 401 if not authorized to execute administrator tasks', async () => {
    const jwt = await testUtils.getLoginToken(app, 'Thomas', 'test');

    const response = await testUtils.banFromChannel(
      app,
      jwt,
      'welcome',
      'bannedUserName',
    );

    expect(response.status).toBe(401);
  });

  it('should return 200 on success and remove member from channel', async () => {
    const jwt = await testUtils.createUserAndJoinToChannel(
      app,
      'Karsten',
      'KarstensChannel',
      'channelPassword',
    );
    await testUtils.createUserAndJoinToChannel(
      app,
      'bannedUserName',
      'KarstensChannel',
      'channelPassword',
    );

    const response = await testUtils.banFromChannel(
      app,
      jwt,
      'KarstensChannel',
      'bannedUserName',
    );

    expect(response.status).toBe(200);
    expect(
      (await userService.getUser('bannedUserName'))?.getChannelNames(),
    ).toEqual(['welcome']);
  });
});
