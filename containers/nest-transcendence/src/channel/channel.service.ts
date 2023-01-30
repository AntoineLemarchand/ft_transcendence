import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Channel, Message } from './channel.entities';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';
import { UserService } from '../user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { ErrForbidden, ErrNotFound, ErrUnAuthorized } from '../exceptions';

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
    const channel = await this.getChannelByName(message.channel);
    if (channel.isUserMuted(message.sender))
      return ;
    await channel.addMessage(message);
    await this.channelRepository.save(channel);
    await this.broadcastingGateway.emitMessage(message.channel, message);
  }

  async muteMemberForMinutes(
    executorName: string,
    mutedUsername: string,
    minutesToMute: number,
    channelName: string,
  ) {
    const channel = await this.getChannelByName(channelName);
    this.prohibitNonAdminAccess(
      channel,
      executorName,
      'only admins can mute other members',
    );
    const muteCandidate = await this.userService.getUser(mutedUsername);
    if (muteCandidate === undefined)
      throw new ErrNotFound('User does exist');
    if (!muteCandidate.channelNames.includes(channelName))
      throw new ErrNotFound('User is not ErrNotFoundmember');
    channel.muteUser(mutedUsername, minutesToMute);
    await this.channelRepository.save(channel);
  }

  async addChannel(
    channelName: string,
    executorName: string,
    password: string,
    channelType: string,
  ): Promise<Channel> {
    const result = new Channel(
      channelName,
      executorName,
      password,
      channelType,
    );
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
    targetUsername: string,
    channelName: string,
    channelPassword: string,
    channelType = 'standardChannel',
  ): Promise<Channel> {
    checkName();
    const channel = (await this.getChannelByName(channelName).catch(
      async () => {
        return await this.addChannel(
          channelName,
          targetUsername,
          channelPassword,
          channelType,
        );
      },
    )) as Channel;
    await isJoiningAllowed();
    return await this.addUserToChannel(targetUsername, channelName, channel);

    function checkName() {
      if (
        (channelName.includes('_') && channelType != 'directMessage') ||
        channelName.match(/\d/)
      )
        throw new ErrForbidden(
          'channelnames cannot contain underscores or numbers',
        );
    }
    async function isJoiningAllowed() {
      if (
        channel.getType() == 'privateChannel' &&
        targetUsername != channel.getAdmins()[0]
      )
        throw new ErrUnAuthorized('joining a private channel is not allowed',
        );
      if (channel.isUserBanned(targetUsername))
        throw new ErrUnAuthorized('the user is banned');
			if (
				(await channel.getPassword()) &&
				(await channel.comparePassword(channelPassword) == false)
			)
        throw new ErrUnAuthorized('wrong password');
    }
  }

  private async addUserToChannel(
    targetUsername: string,
    channelName: string,
    channel: Channel,
  ) {
    await this.userService.addChannelName(targetUsername, channelName);
    await this.broadcastingGateway.putUserInRoom(targetUsername, channelName);
    return channel as Channel;
  }

  async banUserFromChannel(
    executorName: string,
    bannedUsername: string,
    channelName: string,
  ): Promise<void> {
    const channel: Channel = await this.getChannelByName(channelName);
    this.prohibitNonAdminAccess(
      channel,
      executorName,
      'This user is not an admin',
    );
    if (channel.isOwner(bannedUsername))
      throw new ErrForbidden("An owner cannot be banned");
    channel.banUser(bannedUsername);
    await this.userService.removeChannelName(bannedUsername, channelName);
  }
  async inviteToChannel(
    executorName: string,
    invitedName: string,
    channelName: string,
  ) {
    const channel = (await this.getChannelByName(channelName).catch(
      (exception) => {
        throw new ErrNotFound(exception);
      },
    )) as Channel;
    this.prohibitNonAdminAccess(
      channel,
      executorName,
      'only admins can invite',
    );
    await this.addUserToChannel(invitedName, channelName, channel);
    await channel.unbanUser(invitedName);
  }

  async createDirectMessageChannelFor(
    executorName: string,
    invitedUsername: string,
  ) {
    const channelName = executorName + '_' + invitedUsername;
    await this.joinChannel(executorName, channelName, '', 'directMessage');
    await this.inviteToChannel(executorName, invitedUsername, channelName);
    await this.makeAdmin(executorName, invitedUsername, channelName);
  }

  async makeAdmin(
    executorName: string,
    adminCandidateUsername: string,
    channelName: string,
  ) {
    const channel = await this.getChannelByName(channelName);
    this.prohibitNonAdminAccess(
      channel,
      executorName,
      'only admins can make other user admins',
    );
    channel.addAdmin(adminCandidateUsername);
    await this.channelRepository.save(channel);
  }

  async setPassword(
    executorName: string,
    newPassword: string,
    channelName: string,
  ) {
    const channel = await this.getChannelByName(channelName);
    this.prohibitNonAdminAccess(
      channel,
      executorName,
      'only admins can change the channel password',
    );
    channel.setPassword(newPassword);
    await this.channelRepository.save(channel);
  }

  private prohibitNonAdminAccess(
    channel: Channel,
    executor: string,
    message: string,
  ) {
    if (!channel.isAdmin(executor))
      throw new ErrUnAuthorized(message);
  }
}
