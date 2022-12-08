import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import User from '../user/user.entities';
import { CreateUserDTO } from '../app.controller';

export class Identity {
  constructor(public name: string, public id: number) {}
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = this.userService.getUser(username);

    if (user !== undefined) {
      if (user.getPassword() === password) return user;
      throw new HttpException('Wrong password', HttpStatus.UNAUTHORIZED);
    }
    throw new HttpException('Could not find user', HttpStatus.UNAUTHORIZED);
  }

  async login(user: Identity) {
    const payload = { user };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  createUser(userCandidate: CreateUserDTO) {
    const user = this.userService.getUser(userCandidate.username);
    if (user !== undefined)
      throw new HttpException('User already exists', HttpStatus.UNAUTHORIZED);
    this.userService.createUser(
      new User(userCandidate.username, userCandidate.password),
    );
    return this.login(new Identity(userCandidate.username, 1));
  }
}
