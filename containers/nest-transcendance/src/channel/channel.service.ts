import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Channel, ChannelType, Message } from './channel.entities';
import { UserRepository } from './channel.repository.mock';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';
import { UserService } from '../user/user.service';

@Injectable()
export class ChannelService {
  constructor(
    private channelRepository: UserRepository,
    private broadcastingGateway: BroadcastingGateway,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async sendMessage(message: Message): Promise<void> {
    await this.channelRepository.findOne(message.channel).then((channel) => {
      channel.addMessage(message);
    });
    //todo: find syntax to differentiate between messages and game states etc
    await this.broadcastingGateway.emitMessage(message.channel, message);
  }

  async addChannel(
    channelName: string,
    ownername: string,
    password: string,
    channelType: ChannelType,
  ): Promise<Channel> {
    return await this.channelRepository
      .create(channelName, ownername, password, channelType)
      .catch(() => {
        throw new HttpException(
          'This channel exists already',
          HttpStatus.CONFLICT,
        );
      });
  }

  async findMatching(regexSearchString: string): Promise<string[]> {
    return await this.channelRepository.findMatching(regexSearchString);
  }

  async getChannels(): Promise<Channel[]> {
    return await this.channelRepository.findAll();
  }

  async getChannelByName(channelName: string) {
    return await this.channelRepository.findOne(channelName);
  }

  async joinChannel(
    userName: string,
    channelName: string,
    channelPassword: string,
    channelType = ChannelType.Normal,
  ): Promise<Channel> {
    checkName();
    const channel = await this.getChannelByName(channelName).catch(async () => {
      return await this.addChannel(
        channelName,
        userName,
        channelPassword,
        channelType,
      );
    });
    await isJoiningAllowed();
    return await this.addUserToChannel(userName, channelName, channel);

    function checkName() {
      if (channelName.includes('_') && channelType != ChannelType.DirectMesage)
        throw new HttpException(
          'channelnames cannot contain underscores',
          HttpStatus.FORBIDDEN,
        );
    }
    async function isJoiningAllowed() {
      if (
        channel.getType() == ChannelType.Private &&
        userName != channel.getAdmins()[0]
      )
        throw new HttpException(
          'joining a private channel is not allowed',
          HttpStatus.UNAUTHORIZED,
        );
      if (await channel.isUserBanned(userName))
        throw new HttpException('the user is banned', HttpStatus.UNAUTHORIZED);
      if (
        (await channel.getPassword()) &&
        (await channel.getPassword()) != channelPassword
      )
        throw new HttpException('wrong password', HttpStatus.UNAUTHORIZED);
    }
  }

  private async addUserToChannel(
    userName: string,
    channelName: string,
    channel: Channel,
  ) {
    await this.userService.addChannelName(userName, channelName);
    await this.broadcastingGateway.putUserInRoom(userName, channelName);
    return channel as Channel;
  }

  async banUserFromChannel(
    usernameOfExecutor: string,
    bannedUserName: string,
    channelName: string,
  ): Promise<void> {
    const channel: Channel = await this.channelRepository.findOne(channelName);
    if (channel.isAdmin(usernameOfExecutor) == false)
      throw new Error('This user is not an admin');
    channel.banUser(bannedUserName);
    await this.userService.removeChannelName(bannedUserName, channelName);
  }

  async inviteToChannel(
    executorName: string,
    invitedName: string,
    channelName: string,
  ) {
    const channel = await this.getChannelByName(channelName).catch(
      (exception) => {
        throw new HttpException(exception, HttpStatus.NOT_FOUND);
      },
    );
    if (channel.isAdmin(executorName) == false)
      throw new HttpException(
        'only admins can invite',
        HttpStatus.UNAUTHORIZED,
      );
    await this.addUserToChannel(invitedName, channelName, channel);
    await channel.unbanUser(invitedName);
  }
  async createDirectMessageChannelFor(
    invitingUsername: string,
    invitedUsername: string,
  ) {
    const channelName = invitingUsername + '_' + invitedUsername;
    await this.joinChannel(
      invitingUsername,
      channelName,
      '',
      ChannelType.DirectMesage,
    );
    await this.inviteToChannel(invitingUsername, invitedUsername, channelName);
    await this.makeAdmin(invitingUsername, invitedUsername, channelName);
  }

  test(){

  }

  async makeAdmin(
    executor: string,
    adminCandidateUsername: string,
    channelName: string,
  ) {
    const channel = await this.channelRepository.findOne(channelName);
    if (channel.isAdmin(executor) == false)
      throw new HttpException(
        'only admins can make other user admins',
        HttpStatus.UNAUTHORIZED,
      );
    channel.addAdmin(adminCandidateUsername);
  }
}
