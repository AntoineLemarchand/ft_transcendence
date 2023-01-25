import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { GameObjectRepository } from "./game.currentGames.repository";
import { BroadcastingGateway } from "../broadcasting/broadcasting.gateway";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GameInput, GameObject, GameProgress, GameStat, Player } from "./game.entities";
import { ErrUnAuthorized } from "../exceptions";

@Injectable()
export class GameService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @Inject(forwardRef(() => BroadcastingGateway))
    public broadcastingGateway: BroadcastingGateway,
    private currentGames: GameObjectRepository,
    @InjectRepository(GameStat)
    private readonly gameRepository: Repository<GameStat>,
  ) {}

  async initGame(player1name: string, player2name: string) {
    await this.areValidPlayers(player1name, player2name);
    const alreadyCreatedGame = this.getNonFinishedGameObjectFor(player1name, player2name);
    if (alreadyCreatedGame !== undefined)
      return alreadyCreatedGame;
    const result = this.currentGames.create(player1name, player2name);
    await this.createRoom(player1name, result.getId(), player2name);
    return result;
  }

  private getNonFinishedGameObjectFor(player1name: string, player2name: string) {
    for (const runningGames of this.currentGames.findAll()) {
      if (
        runningGames.players.find((player) => player.name === player1name) &&
        runningGames.players.find((player) => player.name === player2name) &&
        runningGames.getProgress() != GameProgress.FINISHED
      ) {
        return runningGames;
      }
    }
    return undefined;
  }

  getRunningGames(): GameObject[] {
    return this.currentGames
      .findAll()
      .filter(
        (gameObject) => gameObject.getProgress() === GameProgress.RUNNING,
      );
  }

  getGamesForUser(username: string) {
    return this.currentGames
      .findAll()
      .filter(
        (gameObject) =>
          gameObject.players[0].name === username ||
          gameObject.players[1].name === username,
      );
  }

  async setReady(executorName: string, gameId: number) {
    const game = await this.currentGames.findOne(gameId);
    await this.prohibitNonPlayerActions(executorName, game);
    game.setReady(executorName);
    if (game.getProgress() === GameProgress.RUNNING) this.runGame(game);
  }

  async unsetReady(executorName: string, gameId: number) {
    const game = await this.currentGames.findOne(gameId);
    await this.prohibitNonPlayerActions(executorName, game);
    game.unsetReady(executorName);
  }

  async runGame(game: GameObject) {
    function sendStartEvent(broadcastingGateway: BroadcastingGateway) {
      broadcastingGateway.emitGameUpdate(game.getId().toString(), game);
    }

    sendStartEvent(this.broadcastingGateway);
    while (game.getProgress() !== GameProgress.FINISHED) {
      game.executeStep();
      this.broadcastingGateway.emitGameUpdate(game.getId().toString(), game);
      await this.sleepUntilCollision(game);
    }
    await this.saveGameStat(game);
  }

  async sleepUntilCollision(game: GameObject) {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 * game.collision.getTimeUntilImpact()),
    );
  }

  private async prohibitNonPlayerActions(
    executorName: string,
    game: GameObject,
  ) {
    if (!game.getPlayerNames().find((name) => name === executorName))
      return Promise.reject(
        new ErrUnAuthorized('this action is reserved to active players'),
      );
  }

  private async areValidPlayers(player1name: string, player2name: string) {
    if (player1name === player2name)
      return Promise.reject(
        new ErrUnAuthorized('a player cannot play against himself'),
      );
    if (
      (await this.userService.getUser(player1name)) === undefined ||
      (await this.userService.getUser(player2name)) === undefined
    )
      return Promise.reject(
        new ErrUnAuthorized('all players must be registered users'),
      );
  }

  private async createRoom(
    player1name: string,
    gameId: number,
    player2name: string,
  ) {
    await this.broadcastingGateway.putUserInRoom(
      player1name,
      gameId.toString(),
    );
    await this.broadcastingGateway.putUserInRoom(
      player2name,
      gameId.toString(),
    );
  }

  async processUserInput(input: GameInput) {
    const game = await this.currentGames.findOne(input.gameId);
    await this.prohibitNonPlayerActions(input.username, game);
    let player: Player;
    if (input.username === game.getPlayerNames()[0]) player = game.players[0];
    else player = game.players[1];
    if (input.action.includes('start')) {
      if (input.action.includes('Up'))
        player.bar.startMoving(input.timeStamp, 1);
      if (input.action.includes('Down'))
        player.bar.startMoving(input.timeStamp, -1);
    } else player.bar.stopMoving(input.timeStamp);
    this.broadcastingGateway.emitGameUpdate(game.getId().toString(), game);
  }

  async saveGameStat(game: GameObject) {
    await this.gameRepository.save(
      new GameStat(game.getId(), game.getPlayerNames(), game.getPlayerScores()),
    );
  }

  async getGameById(id: number) {
    const result = await this.gameRepository.findOneBy({ gameId: id });
    if (result) return result;
    else return Promise.reject(new Error('No such id'));
  }

  async getGames(): Promise<GameStat[]> {
    return await this.gameRepository.find();
  }

  async getGamesCount() {
    return await this.gameRepository.count();
  }

  getRunningGameForUser(username: string) {
    for (const gameObject of this.currentGames.findAll()) {
      if (
        (gameObject.players[0].name === username ||
          gameObject.players[1].name === username) &&
        gameObject.getProgress() === GameProgress.RUNNING
      )
        return gameObject;
    }
    return undefined;
  }

  async beginSpectate(executorName: string, gameId: number) {
    await this.currentGames.findOne(gameId);
    await this.broadcastingGateway.putUserInRoom(
      executorName,
      gameId.toString(),
    );
  }

  async endSpectate(executorName: string, gameId: number) {
    await this.currentGames.findOne(gameId);
    await this.broadcastingGateway.removeUserFromRoom(
      executorName,
      gameId.toString(),
    );
  }
}
