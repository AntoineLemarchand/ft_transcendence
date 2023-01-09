/* eslint-disable prettier/prettier */
import {
  Controller,
  Delete,
  Get,
  Post,
  Request,
  UseGuards,
  Param, HttpException, HttpStatus
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';

@Controller()
export class UserController {
  constructor(private userService: UserService) {
  }

  @UseGuards(JwtAuthGuard)
  @Post('friend')
  async addFriend(@Request() req: any) {
    await this.userService.addFriend(req.user.name, req.body.username);
    return req.username + ' is now your friend';
  }

  @UseGuards(JwtAuthGuard)
  @Get('friend')
  async getFriends(@Request() req: any) {
    return { friends: await this.userService.getFriends(req.user.name) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('friend')
  async removeFriend(@Request() req: any) {
    await this.userService.removeFriend(req.user.name, req.body.username);
    return req.username + ' is no longer your friend';
  }

  @UseGuards(JwtAuthGuard)
  @Get('info/:username')
  async getInfo(@Param('username') username: string) {
    const result = await this.userService.getUser(username);
    if (result === undefined)
      throw new HttpException('Could not find user', HttpStatus.NOT_FOUND);
    return { userInfo:  result};
  }

  @UseGuards(JwtAuthGuard)
  @Get('info')
  async getInfoAboutSelf(@Request() req: any) {
    const result = await this.userService.getUser(req.user.name);
    if (result === undefined)
      throw new HttpException('Could not find user', HttpStatus.NOT_FOUND);
    return { userInfo:  result};
  }

  @UseGuards(JwtAuthGuard)
  @Get('channels')
  async getChannels(@Request() req: any) {
    return { channels: await this.userService.getChannels(req.user.name) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMatchingNames/:regexString')
  async findMatching(@Param() params: any) {
    const matchingUsernames = await this.userService.findMatching(
      params.regexString
    );
    return { usernames: matchingUsernames };
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMatchingNames')
  async findAllUserNames(@Param() params: any) {
    const matchingUsernames = await this.userService.findMatching('');
    return { usernames: matchingUsernames };
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('blockedUser')
  async blockUser(@Request() req: any) {
    await this.userService.blockUser(req.user.name, req.body.username);
    return req.username + ' is now blocked';
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('blockedUser')
  async getBlockedUsers(@Request() req: any) {
    return { blockedUsers: await this.userService.getBlockedUsers(req.user.name) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('blockedUser')
  async unblockUser(@Request() req: any) {
    await this.userService.unblockUser(req.user.name, req.body.username);
    return req.username + ' is no longer blocked';
  }

}
