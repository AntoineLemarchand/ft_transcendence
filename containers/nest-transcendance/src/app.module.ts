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

@Module({
  imports: [
    forwardRef(() => UserModule),
    GameModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ChannelModule),
    forwardRef(() => BroadcastingModule),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: environment.DB_HOST,
      port: environment.DB_PORT as number,
      username: environment.DB_USERNAME,
      password: environment.DB_PASSWORD,
      database: environment.DB_NAME,
      entities: entities,
      synchronize: true,
    }),
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
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
