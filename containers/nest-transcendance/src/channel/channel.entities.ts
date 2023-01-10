//todo: how to prevent duplication with react?
import { Column, Entity, PrimaryColumn } from 'typeorm';

export class Message {
  sender: string;
  content: string;
  channel: string;
  constructor() {
    this.sender = '';
    this.channel = '';
    this.content = '';
  }
}

export enum ChannelType {
  Normal,
  Private,
  DirectMesage,
}

@Entity()
export class Channel {
  @Column('jsonb')
  public messages: Message[];
  @Column('text', { array: true })
  public admins: string[];
  @Column('text', { array: true })
  public bannedUsers: string[];
  @PrimaryColumn()
  public channelName: string;
  @Column({
    nullable: false,
    default: '',
    type: 'varchar',
  })
  public password = '';
  @Column({
    type: 'jsonb',
  })
  public type = ChannelType.Normal;

  constructor(
    channelName: string,
    creatorUserName: string,
    password = '',
    type = ChannelType.Normal,
  ) {
    this.type = type;
    this.password = password;
    this.channelName = channelName;
    this.messages = [];
    this.admins = [creatorUserName];
    this.bannedUsers = [];
  }

  getPassword(): string {
    return this.password;
  }

  getAdmins(): string[] {
    return this.admins;
  }

  addMessage(message: Message) {
    this.messages.push(message);
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getName(): string {
    return this.channelName;
  }

  banUser(bannedUserName: string) {
    this.bannedUsers.push(bannedUserName);
  }

  isUserBanned(userName: string) {
    return this.bannedUsers.includes(userName);
  }

  isAdmin(usernameOfExecutor: string) {
    return this.admins.includes(usernameOfExecutor);
  }

  getType() {
    return this.type;
  }

  unbanUser(username: string) {
    this.bannedUsers = this.bannedUsers.filter(
      (tmpUsername) => tmpUsername != username,
    );
  }

  addAdmin(adminCandidateUsername: string) {
    this.admins.push(adminCandidateUsername);
  }
}
