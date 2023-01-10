import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class User {
  @Column('text', { array: true })
  public friends: string[] = [];
  @Column('text', { array: true })
  public blockedUsers: string[] = [];
  @Column('text', { array: true })
  public channelNames: string[] = [];
  @PrimaryColumn()
  public name: string;
  @Column({
    nullable: false,
    default: '',
  })
  public password: string;

  constructor(name: string, password: string) {
    this.password = password;
    this.name = name;
  }

  getName() {
    return this.name;
  }

  getPassword() {
    return this.password;
  }

  getFriends() {
    return this.friends;
  }

  addFriend(friendname: string) {
    this.friends.forEach((name: string) => {
      if (name === friendname) throw new Error('already a friend');
    });
    this.friends.push(friendname);
  }

  removeFriend(friendname: string) {
    for (let i = 0; i < this.friends.length; i++) {
      if (this.friends[i] === friendname) {
        this.friends.splice(i);
        return;
      }
    }
    throw new Error('not your friend');
  }

  toJson(): JSON {
    return JSON.parse(JSON.stringify(this));
  }

  getChannelNames() {
    return this.channelNames;
  }

  addChannelName(channelName: string) {
    this.channelNames.push(channelName);
  }

  removeChannelName(channelName: string) {
    this.channelNames = this.channelNames.filter(
      (tmpName) => tmpName != channelName,
    );
  }

  getBlockedUsers() {
    return this.blockedUsers;
  }

  blockUser(username: string) {
    this.blockedUsers.forEach((name: string) => {
      // error thrown not necessary?
      if (name === username) throw new Error('already blocked');
    });
    this.blockedUsers.push(username);
  }

  unblockUser(username: string) {
    for (let i = 0; i < this.blockedUsers.length; i++) {
      if (this.blockedUsers[i] === username) {
        this.blockedUsers.splice(i);
        return;
      }
    }
  }
}
