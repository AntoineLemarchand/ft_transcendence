import { Injectable } from '@nestjs/common';
import { Channel, Message } from './channel.entities';
import { ChannelType } from './channel.entities';

@Injectable()
export class UserRepository {
  private channels = new Map<string, Channel>();

  constructor() {
    this.channels.set('welcome', new Channel('welcome', 'admin'));
    this.channels.set('welcom', new Channel('welcom', 'scam'));
    this.channels.set('wlcm', new Channel('wlcm', 'scam'));
    this.channels.set('ab', new Channel('ab', 'scam'));
  }

  async findAll(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  async findOne(channelName: string): Promise<Channel> {
    const channel = this.channels.get(channelName);
    if (!channel) return Promise.reject(new Error('No such channel'));
    return channel;
  }

  async remove(channelName: string): Promise<void> {
    this.channels.delete(channelName);
    return;
  }

  async create(
    channelName: string,
    creatorUserName: string,
    password = '',
    channelType: ChannelType = ChannelType.Normal): Promise<Channel> {
    if (this.channels.has(channelName))
      return Promise.reject(new Error('this channel exists already'));
    this.channels.set(
      channelName,
      new Channel(channelName, creatorUserName, password, channelType),
    );
    return this.channels.get(channelName) as Channel;
  }

  async addMessageToChannel(
    channelName: string,
    message: Message,
  ): Promise<void> {
    const channel = await this.findOne(channelName);
    channel.addMessage(message);
    this.channels.set(channelName, channel);
  }

  async findMatching(regexSearchString: string): Promise<string[]> {
    const result: string[] = [];

    this.channels.forEach((value, key, map) => {
      if (new RegExp(regexSearchString, 'g').test(key))
        result.push(value.getName());
    });
    return result;
  }

  clear() {
    this.channels.clear();
  }
}
