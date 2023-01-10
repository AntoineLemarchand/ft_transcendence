import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { ChannelService } from './channel.service';
import { ChannelType } from './channel.entities';

@Controller()
export class ChannelController {
  constructor(private channelService: ChannelService) {}

  private getChannelType(name = 'normal') {
    if (name === 'directMessage') return ChannelType.DirectMesage;
    if (name === 'private') return ChannelType.Private;
    return ChannelType.Normal;
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  async addChannel(@Request() req: any) {
    if (!req.body.channelType)
      throw new HttpException(
        'no channel type specified',
        HttpStatus.BAD_REQUEST,
      );
    const channelType = this.getChannelType(req.body.channelType);
    if (req.body.channelType == 'directMessage') {
      return {
        channel: await this.channelService.createDirectMessageChannelFor(
          req.user.name,
          req.body.targetUsername,
        ),
      };
    }
    return {
      channel: await this.channelService.joinChannel(
        req.user.name,
        req.body.channelName,
        req.body.channelPassword,
        channelType,
      ),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite')
  async inviteToChannel(@Request() req: any) {
    await this.channelService.inviteToChannel(
      req.user.name,
      req.body.username,
      req.body.channelName,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('findAll')
  async getChannels() {
    const allChannels = await this.channelService.getChannels();
    return { channels: allChannels };
  }

  @UseGuards(JwtAuthGuard)
  @Get('findOne/:channelName')
  async getChannelByName(@Param() params: any) {
    try {
      const result = await this.channelService.getChannelByName(
        params.channelName,
      );
      return { channel: result };
    } catch (e) {
      throw new HttpException(e.name, HttpStatus.NOT_FOUND);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMatchingNames/:regexString')
  async findMatching(@Param() params: any) {
    const matchingChannels = await this.channelService.findMatchingNames(
      params.regexString,
    );
    return { channels: matchingChannels };
  }

  @UseGuards(JwtAuthGuard)
  @Get('getMatchingNames')
  async findAllChannelNames(@Request() req: any) {
    const matchingChannels = await this.channelService.findMatchingNames('');
    return { channels: matchingChannels };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('user')
  async banUser(@Request() req: any) {
    const matchingChannel = await this.channelService.getChannelByName(
      req.body.channelName,
    );
    try {
      await this.channelService.banUserFromChannel(
        req.user.name,
        req.body.bannedUserName,
        req.body.channelName,
      );
    } catch (e) {
      throw new HttpException(e, HttpStatus.UNAUTHORIZED);
    }
  }
}
