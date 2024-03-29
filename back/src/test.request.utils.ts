import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Response } from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Channel } from './channel/channel.entities';

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
  image?: Buffer,
) => {
  if (image)
    return request(callerModule.getHttpServer())
      .post('/auth/signin')
      .field('username', username)
      .field('password', password)
      .attach('image', image, 'test.png');
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

export const isUsingTwoFactorAuth = async (
  callerModule: INestApplication,
  jwt: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/auth/2fa/status')
    .set('Authorization', 'Bearer ' + jwt);
};

export async function activateTwoFactorAuth(
  callerModule: INestApplication,
  jwt: any,
) {
  return request(callerModule.getHttpServer())
    .post('/auth/2fa/activate')
    .set('Authorization', 'Bearer ' + jwt);
}

export async function deactivateTwoFactorAuth(
  callerModule: INestApplication,
  jwt: any,
) {
  return request(callerModule.getHttpServer())
    .post('/auth/2fa/deactivate')
    .set('Authorization', 'Bearer ' + jwt);
}

export async function logInTwoFactor(
  callerModule: INestApplication,
  jwt: any,
  code2fa: string,
) {
  return request(callerModule.getHttpServer())
    .post('/auth/2fa/login')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      code2fa: code2fa,
    });
}

export async function testTwoFactorAuth(
  callerModule: INestApplication,
  jwt: any,
) {
  return request(callerModule.getHttpServer())
    .get('/auth/2fa/test')
    .set('Authorization', 'Bearer ' + jwt);
}


export const joinChannel = async (
  callerModule: INestApplication,
  jwt: string,
  channelName: string,
  channelPassword = 'default',
  channelType = 'standardChannel',
) => {
  return request(callerModule.getHttpServer())
    .post('/channel/join')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      channelPassword: channelPassword,
      channelType: channelType,
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
  bannedUsername: string,
) => {
  return request(callerModule.getHttpServer())
    .delete('/channel/user')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      bannedUsername: bannedUsername,
    });
};

export async function createUserAndJoinToChannel(
  callerModule: INestApplication,
  username: string,
  channelName: string,
  channelPassword?: string,
) {
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

export async function getChannelAdmins(
  callerModule: INestApplication,
  jwt: any,
  channelName: string,
) {
  const response = await request(callerModule.getHttpServer())
    .get('/channel/admin')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
    });
  return response;
}

export async function addChannelAdmin(
  app: INestApplication,
  jwt: string,
  targetUsername: string,
  channelName: string,
) {
  const response = await request(app.getHttpServer())
    .post('/channel/admin')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      adminCandidate: targetUsername,
    });
  return response;
}

export async function changeChannelPassword(
  app: INestApplication,
  jwt: string,
  newPassword: string,
  channelName: string,
) {
  const response = await request(app.getHttpServer())
    .post('/channel/password')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      newPassword: newPassword,
    });
  return response;
}

export async function createDirectMessage(
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

export async function inviteToChannel(
  callerModule: INestApplication,
  jwt: string,
  channelName: string,
  username: string,
) {
  return request(callerModule.getHttpServer())
    .post('/channel/invite')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      username: username,
    });
}

export async function muteUser(
  callerModule: INestApplication,
  jwt: any,
  mutedUsername: string,
  channelName: string,
  muteForMinutes: number,
) {
  return request(callerModule.getHttpServer())
    .post('/channel/mute')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      channelName: channelName,
      mutedUsername: mutedUsername,
      muteForMinutes: muteForMinutes,
    });
}

export async function initGame(
  callerModule: INestApplication,
  jwt: any,
  player2: string,
) {
  return request(callerModule.getHttpServer())
    .post('/game/init')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      player2: player2,
    });
}

export async function joinMatchMaking(
  callerModule: INestApplication,
  jwt: any,
) {
  return request(callerModule.getHttpServer())
    .post('/game/matchMaking')
    .set('Authorization', 'Bearer ' + jwt);
}

export async function getAllRunning(callerModule: INestApplication, jwt: any) {
  return request(callerModule.getHttpServer())
    .get('/game/getRunning')
    .set('Authorization', 'Bearer ' + jwt);
}

export async function getAllGamesForUser(
  callerModule: INestApplication,
  jwt: any,
) {
  return request(callerModule.getHttpServer())
    .get('/game/getPerUser')
    .set('Authorization', 'Bearer ' + jwt);
}

export async function setReadyForGame(
  callerModule: INestApplication,
  jwt: any,
  gameId: number,
) {
  return request(callerModule.getHttpServer())
    .post('/game/setReady')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      gameId: gameId.toString(),
    });
}

export async function setMode(
  callerModule: INestApplication,
  jwt: any,
  gameId: number,
) {
  return request(callerModule.getHttpServer())
    .post('/game/setMode')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      gameId: gameId.toString(),
    });
}

export const getMode = async (
  callerModule: INestApplication,
  jwt: string,
  gameId: number
) => {
  return request(callerModule.getHttpServer())
    .get('/game/getMode/' + gameId)
    .set('Authorization', 'Bearer ' + jwt);
};

export async function startSpectatingGame(
  callerModule: INestApplication,
  jwt: any,
  gameId: number,
) {
  return request(callerModule.getHttpServer())
    .post('/game/spectate')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      gameId: gameId.toString(),
    });
}

export async function endSpectatingGame(
  callerModule: INestApplication,
  jwt: any,
  gameId: number,
) {
  return request(callerModule.getHttpServer())
    .delete('/game/spectate')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      gameId: gameId.toString(),
    });
}

export async function setNotReadyForGame(
  callerModule: INestApplication,
  jwt: any,
  gameId: number,
) {
  return request(callerModule.getHttpServer())
    .delete('/game/setReady')
    .set('Authorization', 'Bearer ' + jwt)
    .send({
      gameId: gameId.toString(),
    });
}

export const getSavedGames = async (
  callerModule: INestApplication,
  jwt: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/game/getSavedGames')
    .set('Authorization', 'Bearer ' + jwt);
};

export const getGameById = async (
  callerModule: INestApplication,
  jwt: string,
  gameId: number,
) => {
  return request(callerModule.getHttpServer())
    .get('/game/getById/' + gameId)
    .set('Authorization', 'Bearer ' + jwt);
};

export const getSavedGamesCount = async (
  callerModule: INestApplication,
  jwt: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/game/getSavedGamesCount')
    .set('Authorization', 'Bearer ' + jwt);
};

export const getSavedGamesByPlayer = async (
  callerModule: INestApplication,
  jwt: string,
  username: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/game/getSavedGamesByPlayer/' + username)
    .set('Authorization', 'Bearer ' + jwt);
};

export const getWonGamesByPlayer = async (
  callerModule: INestApplication,
  jwt: string,
  username: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/game/getWonGamesByPlayer/' + username)
    .set('Authorization', 'Bearer ' + jwt);
};

export const getWonGamesCountByPlayer = async (
  callerModule: INestApplication,
  jwt: string,
  username: string,
) => {
  return request(callerModule.getHttpServer())
    .get('/game/getWonGamesCountByPlayer/' + username)
    .set('Authorization', 'Bearer ' + jwt);
};
