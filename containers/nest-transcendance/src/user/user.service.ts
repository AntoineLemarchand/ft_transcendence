/* eslint-disable prettier/prettier */
import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { User } from './user.entities';
import { ChannelService } from '../channel/channel.service';
import { Channel } from '../channel/channel.entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  users: User[];

	constructor(
		@Inject(forwardRef(() => ChannelService))
		private channelService: ChannelService,
    @InjectRepository(User) private readonly userRepository: Repository<User>)
{
		this.users = [new User('Thomas', 'test')]
	}

  getUser(name: string): User | undefined {
    for (const user of this.users) {
      if (user.getName() === name)
        return user;
    }
		return undefined;
  }

  async createUser(user: User) {
    this.users.push(user);
    await this.userRepository.save(user);
  }

  deleteUser(name: string) {
    const toDelete: User | undefined = this.users.find(
      (user) => user.getName() == name
    );
    if (toDelete == undefined)
      throw new Error('User does not exist');
    const userIndex: number = this.users.indexOf(toDelete);
    this.users.splice(userIndex, 1);
  }

	addFriend(username: string, friendname: string){
		const friend = this.getUser(friendname);
		if (friend === undefined)
			throw new HttpException('Could not find user', HttpStatus.NOT_FOUND);
		try {
			(this.getUser(username) as User).addFriend(friendname);
		} catch (e) {
			throw new HttpException('is already a friend', HttpStatus.UNAUTHORIZED)
		}
	}

	removeFriend(username: string, friendname: string){
		try{
			(this.getUser(username) as User).removeFriend(friendname);
		} catch (e) {
			throw new HttpException('not your friend', HttpStatus.NOT_FOUND)
		}
	}

	getFriends(username: string){
		const user = this.getUser(username) as User;
		return user.getFriends();
	}

	getInfo(username: string) {
		const user = this.getUser(username) as User;
		if (user === undefined)
			throw new HttpException('Could not find user', HttpStatus.NOT_FOUND);
		return user;
	}

	async getChannels(username: string) {
		const user = this.getInfo(username);
		const result: Channel[] = [];
		for (const channelName of user.getChannelNames())
			result.push(await this.channelService.getChannelByName(channelName));
		return result;
	}

	async addChannelName(username: string, channelName: string) {
		const user: User = this.getInfo(username);
		if (user.getChannelNames().includes(channelName))
			throw new HttpException('user has already joined the channel', HttpStatus.CONFLICT);
		return user.addChannelName(channelName);
	}

	removeChannelName(username: string, channelName: string) {
		const user: User = this.getInfo(username);
		return user.removeChannelName(channelName);
	}

	async getAllUsernames(){
    const userlist = await this.userRepository.find();
    return userlist;
	}

	async findMatching(regexSearchString: string): Promise<string[]> {
			const result: string[] = [];

			await this.users.forEach(async (value, key, map) => {
			if (new RegExp(regexSearchString, 'g').test(await value.getName()))
				result.push(value.getName());
		});
		return result;
	}
	
  blockUser(username: string, userToBlock: string){
		const user = this.getUser(userToBlock);
		if (user === undefined)
			throw new HttpException('Could not find user', HttpStatus.NOT_FOUND);
		try {
			(this.getUser(username) as User).blockUser(userToBlock);
		} catch (e) {
			throw new HttpException('is already blocked', HttpStatus.UNAUTHORIZED)
		}
	}
	
  getBlockedUsers(username: string){
		const user = this.getUser(username) as User;
		return user.getBlockedUsers();
	}

	unblockUser(username: string, userToUnblock: string){
		(this.getUser(username) as User).unblockUser(userToUnblock);
	}

}
