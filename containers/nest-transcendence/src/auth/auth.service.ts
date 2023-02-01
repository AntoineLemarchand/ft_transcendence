import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entities';
import { CreateUserDTO } from '../app.controller';
import { ErrForbidden, ErrUnAuthorized } from '../exceptions';
import axios from 'axios';
import { authenticator } from 'otplib';
import { toFileStream } from 'qrcode';
import { Response } from 'express';
import * as qrCode from 'qrcode';

export class Identity {
  constructor(public name: string, public id: number) {}
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userService.getUser(username);

    if (user !== undefined) {
      if (user.comparePassword(password)) return user;
      throw new ErrUnAuthorized('Wrong password');
    }
    throw new ErrUnAuthorized('Could not find user');
  }

  async login(user: Identity) {
    const payload = { user };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async generateJwt(payload: any) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async createUser(userCandidate: CreateUserDTO) {
    const user = await this.userService.getUser(userCandidate.username);
    if (user !== undefined) throw new ErrUnAuthorized('User already exists');
    if (userCandidate.username.includes('_'))
      throw new ErrForbidden('no underscores in usernames');
    const newUser: User = new User(
      userCandidate.username,
      userCandidate.password,
    );
    if (userCandidate.image) {
      newUser.image = userCandidate.image.buffer;
      newUser.imageFormat = userCandidate.image.mimetype;
    }

    await this.userService.createUser(newUser);
    return this.login(new Identity(userCandidate.username, 1));
  }

  async fetchUser(accessToken: string): Promise<any> {
    const { data: searchResponse } = await axios.get(
      'https://api.intra.42.fr/v2/me',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return searchResponse;
  }

  async getUserInfo(user: Identity): Promise<any> {
    return this.userService.getUser(user.name);
  }

  async activate2fa(username: string) {
    const secret = authenticator.generateSecret();
    const app_name: string = process.env
      .TWO_FACTOR_AUTHENTICATION_APP_NAME as string;
    const otpAuthUrl = authenticator.keyuri(username, app_name, secret);
    await this.userService.set2faSecret(username, secret);
    return otpAuthUrl;
  }

  async deactivate2fa(username: string) {
    await this.userService.set2faSecret(username, '');
  }

  public async qrCodeStreamPipe(otpPathUrl: string) {
    return await qrCode.toBuffer(otpPathUrl);
  }

  async logIn2fa(username: string, code2fa: string) {
    const user = await this.userService.getUser(username);
    const isValid = await authenticator.verify({
      token: code2fa,
      secret: user!.secret2fa,
    });
    if (!isValid) throw new ErrUnAuthorized('wrong 2fa code');
    return this.generateJwt({
      user: { name: username, hasSucceeded2Fa: true },
    });
  }

  async isUserUsing2fa(username: string) {
    const user = (await this.userService.getUser(username)) as User;
    return user.secret2fa !== '';
  }
}
