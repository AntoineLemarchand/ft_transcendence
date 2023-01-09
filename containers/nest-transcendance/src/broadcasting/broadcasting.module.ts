import { forwardRef, Module } from '@nestjs/common';
import { BroadcastingGateway } from './broadcasting.gateway';
import { UserModule } from '../user/user.module';
import { ChannelModule } from '../channel/channel.module';
import { User } from '../user/user.entities';
import { WsGuard } from '../auth/websocket.auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => ChannelModule),
    forwardRef(() => AuthModule),
  ],
})
export class BroadcastingModule {}
