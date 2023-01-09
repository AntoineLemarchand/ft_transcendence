import { Test } from '@nestjs/testing';
import { Response } from 'supertest';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Channel, ChannelType } from './channel/channel.entities';

export async function extractBearerToken(loginResponse: Promise<Test>) {
  const jwt: string = await loginResponse.then((response: Response) => {
    return response.body.access_token;
  });
  return jwt;
}

export const addFriend = async (
  callerModule: INestApplication,
  jwt: string,
  username: string,
) => {
  return request(callerModule.getHttpServer())
    .post('/user/friend')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      username: username,
    });
};

export const getFriends = async (
  callerModule: INestApplication,
  jwt: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/user/friend')
    .set('Authorization', 'Bearer ' + jwt);
};

export const removeFriend = async (
  callerModule: INestApplication,
  jwt: string,
  username: string,
) => {
  return request(callerModule.getHttpServer())
    .delete('/user/friend')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      username: username,
    });
};

export const loginUser = async (
  callerModule: INestApplication,
  username: string,
  password: string,
) => {
  return request(callerModule.getHttpServer()).post('/auth/login').send({
    username: username,
    password: password,
  });
};

export const signinUser = async (
  callerModule: INestApplication,
  username: string,
  password: string,
) => {
  return request(callerModule.getHttpServer()).post('/auth/signin').send({
    username: username,
    password: password,
  });
};

export const getLoginToken = async (
  callerModule: INestApplication,
  username: string,
  password: string,
) => {
  const loginResponse = await loginUser(callerModule, username, password);
  return await loginResponse.body.access_token;
};

export const getUserData = async (
  callerModule: INestApplication,
  jwt: string,
  name: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/user/info/' + name)
    .set('Authorization', 'Bearer ' + jwt);
};

export const joinChannel = async (
  callerModule: INestApplication,
  jwt: string,
  channelName: string,
  channelPassword = 'default',
  type: ChannelType = ChannelType.Normal) => {
  return request(callerModule.getHttpServer())
    .post('/channel/join')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      channelPassword: channelPassword,
      channelType: 'private',
    });
};

export const getChannels = async (
  callerModule: INestApplication,
  jwt: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/channel/findAll')
    .set('Authorization', 'Bearer ' + jwt);
};

export const banFromChannel = async (
  callerModule: INestApplication,
  jwt: string,
  channelName: string,
  bannedUserName: string,
) => {
  return request(callerModule.getHttpServer())
    .delete('/channel/user')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      bannedUserName: bannedUserName,
    });
};

export async function createUserAndJoinToChannel(
  callerModule: INestApplication,
  username: string,
  channelName: string,
  channelPassword?: string) {
  const jwt = (await signinUser(callerModule, username, 'password')).body
    .access_token;
  await joinChannel(callerModule, jwt, channelName, channelPassword);
  return jwt;
}

export const doesChannelExist = async (
  callerModule: INestApplication,
  jwt: string,
  channelName: string,
) => {
  const response = await getChannels(callerModule, jwt);
  const channels = response.body.channels;
  const allChannels: Channel[] = channels;
  const tmp = allChannels.find(
    (channel: any) => channel.channelName == channelName,
  );
  return tmp !== undefined;
};

export async function getMatchingChannelNames(
  callerModule: INestApplication,
  jwt: string,
  regexString: string,
) {
  const result = await request(callerModule.getHttpServer())
    .get('/channel/getMatchingNames/' + regexString)
    .set('Authorization', 'Bearer ' + jwt);
  const channelNames = result.body.channels;
  const allChannels = channelNames;
  return allChannels;
}

export async function getChannelByName(
  callerModule: INestApplication,
  jwt: string,
  channelName: string,
): Promise<Channel | undefined> {
  const raw = await request(callerModule.getHttpServer())
    .get('/channel/findOne/' + channelName)
    .set('Authorization', 'Bearer ' + jwt);
  const fromJson = raw.body.channel;
  const result = Object.create(Channel.prototype);
  Object.assign(result, fromJson);
  return result;
}

export const blockUser = async (
  callerModule: INestApplication,
  jwt: string,
  username: string,
) => {
  return request(callerModule.getHttpServer())
    .post('/user/blockedUser')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      username: username,
    });
};

export const getBlockedUsers = async (
  callerModule: INestApplication,
  jwt: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/user/blockedUser')
    .set('Authorization', 'Bearer ' + jwt);
};

export const unblockUser = async (
  callerModule: INestApplication,
  jwt: string,
  username: string,
) => {
  return request(callerModule.getHttpServer())
    .delete('/user/blockedUser')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      username: username,
    });
};
