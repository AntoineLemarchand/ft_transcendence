import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Channel, ChannelType, Message } from './channel.entities';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';
import { UserService } from '../user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private readonly channelRepository: Repository<Channel>,
    private broadcastingGateway: BroadcastingGateway,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  async sendMessage(message: Message): Promise<void> {
    const channel = await await this.getChannelByName(message.channel);
    await channel.addMessage(message);
    await this.channelRepository.save(channel);
    //todo: find syntax to differentiate between messages and game states etc
    await this.broadcastingGateway.emitMessage(message.channel, message);
  }

  async addChannel(
    channelName: string,
    ownername: string,
    password: string,
    channelType: ChannelType,
  ): Promise<Channel> {
    const result = new Channel(channelName, ownername, password, channelType);
    await this.channelRepository.save(result);
    return result;
  }

  async findMatchingNames(regexSearchString: string): Promise<string[]> {
    const matchingChannels = await this.channelRepository.findBy({
      channelName: Like(`%${regexSearchString}%`),
    });
    return await matchingChannels.map((channel) => channel.getName());
  }

  async getChannels(): Promise<Channel[]> {
    return await this.channelRepository.find();
  }

  async getChannelByName(channelName: string) {
    const result = await this.channelRepository.findOneBy({
      channelName: channelName,
    });
    if (result) return result;
    else return Promise.reject(new Error('No such channel'));
  }

  async joinChannel(
    userName: string,
    channelName: string,
    channelPassword: string,
    channelType = ChannelType.Normal,
  ): Promise<Channel> {
    checkName();
    const channel = (await this.getChannelByName(channelName).catch(
      async () => {
        return await this.addChannel(
          channelName,
          userName,
          channelPassword,
          channelType,
        );
      },
    )) as Channel;
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
    const channel: Channel = await this.getChannelByName(channelName);
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
    const channel = (await this.getChannelByName(channelName).catch(
      (exception) => {
        throw new HttpException(exception, HttpStatus.NOT_FOUND);
      },
    )) as Channel;
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

  async makeAdmin(
    executor: string,
    adminCandidateUsername: string,
    channelName: string,
  ) {
    const channel = await this.getChannelByName(channelName);
    if (channel.isAdmin(executor) == false)
      throw new HttpException(
        'only admins can make other user admins',
        HttpStatus.UNAUTHORIZED,
      );
    channel.addAdmin(adminCandidateUsername);
    await this.channelRepository.save(channel);
  }
}
