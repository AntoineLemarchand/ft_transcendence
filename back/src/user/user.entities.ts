import { Column, Entity, PrimaryColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Entity()
export class User {
  @Column({ type: 'bytea' })
  public image: Buffer;
  @Column('text')
  public imageFormat: string | undefined;
  @Column({
    nullable: false,
    default: '',
  })
  public accessToken: string;
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
  @Column({ nullable: true, default: '' })
  secret2fa: string;

  constructor(name: string, password: string, accessToken: string, image?: Express.Multer.File) {
    this.password = password;
    this.hashPassword(password);
    this.name = name;
    if (image) {
      this.image = image.buffer;
      this.imageFormat = image.mimetype;
    } else {
      this.image = Buffer.from('');
      this.imageFormat = '';
    }
    this.accessToken = accessToken;
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

  setImage(image: Express.Multer.File) {
    this.image = image.buffer;
    this.imageFormat = image.mimetype;
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

  private hashPassword(plaintextPassword: string) {
    const saltRounds = 10;

    if (plaintextPassword === undefined) return;
    this.password = bcrypt.hashSync(plaintextPassword, saltRounds);
  }

  comparePassword(plaintextPassword: string) {
    if (plaintextPassword === undefined) return;
    return bcrypt.compareSync(plaintextPassword, this.password);
  }
}
