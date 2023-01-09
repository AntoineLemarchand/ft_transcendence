import { forwardRef, Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { Message } from './channel.entities';
import { UserRepository } from './channel.repository.mock';
import { ChannelController } from './channel.controller';
import { BroadcastingGateway } from '../broadcasting/broadcasting.gateway';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { BroadcastingModule } from '../broadcasting/broadcasting.module';

@Module({
  imports: [Message, forwardRef(() => AuthModule), forwardRef(() => UserModule), forwardRef(() => BroadcastingModule)],
  providers: [ChannelService, UserRepository, BroadcastingGateway],
  exports: [ChannelService, Message],
  controllers: [ChannelController],
})
export class ChannelModule {}
