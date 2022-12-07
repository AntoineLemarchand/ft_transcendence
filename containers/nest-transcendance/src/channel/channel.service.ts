import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Channel, Message } from './channel.entities';
import { ChannelRepository } from './channel.repository.mock';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';

@Injectable()
export class ChannelService {
  constructor(
    private channelRepository: ChannelRepository,
    private broadcastingGateway: BroadcastingGateway,
  ) {}
  async sendMessage(message: Message): Promise<void> {
    await this.channelRepository
      .findOne(message.channel)
      .then((channel) => {
        channel.addMessage(message);
      })
      .catch(async () => {
        const newChannel = await this.channelRepository.create(
          message.channel,
          message.sender,
        );
        newChannel.addMessage(message);
      });
    //todo: find syntax to differentiate between messages and game states etc
    await this.broadcastingGateway.emitMessage('', message);
  }

  async addChannel(channelname: string, ownername: string): Promise<void> {
    await this.channelRepository.create(channelname, ownername).catch(() => {
      throw new HttpException(
        'This channel exists already',
        HttpStatus.UNAUTHORIZED,
      );
    });
  }

  async findMatching(regexSearchString: string): Promise<string[]> {
    return await this.channelRepository.findMatching(regexSearchString);
  }

  async getChannels(): Promise<Channel[]> {
    return await this.channelRepository.findAll();
  }
}