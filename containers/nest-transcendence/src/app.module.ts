import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { User } from './user/user.entities';
import { RouterModule } from '@nestjs/core';
import { ChannelModule } from './channel/channel.module';
import { BroadcastingModule } from './broadcasting/broadcasting.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { environment } from './utils/environmentParser';
import entities from './typeorm';
import DataSource from './typeorm/typeOrm.config'
@Module({
  imports: [
    forwardRef(() => UserModule),
    GameModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ChannelModule),
    forwardRef(() => BroadcastingModule),
    forwardRef(() => GameModule),
    TypeOrmModule.forRoot(DataSource.options),
    RouterModule.register([
      {
        path: 'user',
        module: UserModule,
      },
      {
        path: 'auth',
        module: AuthModule,
      },
      {
        path: 'channel',
        module: ChannelModule,
      },
      {
        path: 'game',
        module: GameModule,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
