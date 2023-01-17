import {Controller, Post, Request, UseGuards} from '@nestjs/common';
import {GameService} from "./game.service";
import {JwtAuthGuard} from "../auth/jwt.auth.guard";

@Controller()
export class GameController {
  constructor(private gameService: GameService) {
  }

  @UseGuards(JwtAuthGuard)
  @Post('init')
  async createGame(@Request() req: any) {
    return { gameObject: await this.gameService.initGame(req.user.name, req.body.player2) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('setReady')
  async setReady(@Request() req: any) {
    await this.gameService.setReady(req.user.name, req.body.gameId);
  }
}
