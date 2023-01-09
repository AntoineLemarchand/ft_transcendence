import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { WsGuard } from '../auth/websocket.auth.guard';
import { Message } from '../channel/channel.entities';
import { ChannelService } from '../channel/channel.service';
import { RoomHandler } from './broadcasting.roomHandler';
import { UserService } from '../user/user.service';

//todo: is cors * a security concern in our case?
@WebSocketGateway(8001, {
  cors: {
    origin: 'http://localhost:3001',
    credentials: true,
  },
})
export class BroadcastingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  private roomHandler: RoomHandler;

  constructor(
    @Inject(forwardRef(() => ChannelService))
    private channelService: ChannelService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  //todo: call database layer and store messages
  //todo: invoke guard to check valid token
  @UseGuards(WsGuard)
  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, data: string): void {
    const message = JSON.parse(data);
    message.sender = this.getUsernameFromToken(client);
    this.channelService.sendMessage(message);
  }

  //todo: find syntax to differentiate between messages and game states etc
  emitMessage(eventName: string, message: Message) {
    this.server.in(eventName).emit('messageToClient', JSON.stringify(message));
  }

  async handleConnection(client: Socket, ...args: any[]) {
    if (!this.roomHandler) this.roomHandler = new RoomHandler(this.server);
    const username = this.getUsernameFromToken(client);
    const channelNames: string[] = (await (
      await this.userService.getUser(username)
    )?.getChannelNames()) as string[];
    this.roomHandler.addUserInstance(username, client.id, channelNames);
  }

  async handleDisconnect(client: Socket) {
    const username = this.getUsernameFromToken(client);
    const channelNames: string[] = (await (
      await this.userService.getUser(username)
    )?.getChannelNames()) as string[];
    this.roomHandler.removeUserInstance(username, client.id, channelNames);
  }

  async putUserInRoom(username: string, channelName: string) {
    await this.roomHandler.join(username, channelName);
  }

  private getUsernameFromToken(client: Socket) {
    try {
      return JSON.parse(
        atob((client.handshake.query.auth as string).split('.')[1]),
      ).user.name;
    } catch (e) {
      console.log('not properly encoded token');
    }
  }
}
