/**
 * 游戏状态接口定义
 */
import { IPlayer } from './entities';
import { IWaveManager, IScoreManager } from './systems';

/** 游戏状态类型 */
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver';

/** 游戏主接口 */
export interface IGame {
  state: GameState;
  player: IPlayer;
  waveManager: IWaveManager;
  scoreManager: IScoreManager;
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
}
