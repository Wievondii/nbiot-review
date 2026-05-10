/**
 * 游戏状态机
 * 管理游戏的整体状态流转
 */

import { GameState } from '../types';

/**
 * 游戏状态机
 * 控制游戏在不同状态间的切换
 */
export class GameStateMachine {
  /** 当前游戏状态 */
  private currentState: GameState = 'menu';

  /** 状态变化回调 */
  private stateChangeCallbacks: Map<GameState, Array<() => void>> = new Map();

  /** 状态进入回调 */
  private stateEnterCallbacks: Map<GameState, Array<() => void>> = new Map();

  /** 状态退出回调 */
  private stateExitCallbacks: Map<GameState, Array<() => void>> = new Map();

  constructor() {
    // 初始化回调映射
    this.stateChangeCallbacks.set('menu', []);
    this.stateChangeCallbacks.set('playing', []);
    this.stateChangeCallbacks.set('paused', []);
    this.stateChangeCallbacks.set('gameOver', []);

    this.stateEnterCallbacks.set('menu', []);
    this.stateEnterCallbacks.set('playing', []);
    this.stateEnterCallbacks.set('paused', []);
    this.stateEnterCallbacks.set('gameOver', []);

    this.stateExitCallbacks.set('menu', []);
    this.stateExitCallbacks.set('playing', []);
    this.stateExitCallbacks.set('paused', []);
    this.stateExitCallbacks.set('gameOver', []);
  }

  /**
   * 获取当前状态
   */
  public getState(): GameState {
    return this.currentState;
  }

  /**
   * 设置游戏状态
   * @param newState 新状态
   */
  public setState(newState: GameState): void {
    if (this.currentState === newState) return;

    const oldState = this.currentState;

    // 执行旧状态的退出回调
    this.executeCallbacks(this.stateExitCallbacks.get(oldState) || []);

    // 更新状态
    this.currentState = newState;

    // 执行新状态的进入回调
    this.executeCallbacks(this.stateEnterCallbacks.get(newState) || []);

    // 执行状态变化回调
    this.executeCallbacks(this.stateChangeCallbacks.get(newState) || []);

    console.log(`[GameState] ${oldState} -> ${newState}`);
  }

  /**
   * 开始游戏
   */
  public startGame(): void {
    this.setState('playing');
  }

  /**
   * 暂停游戏
   */
  public pauseGame(): void {
    if (this.currentState === 'playing') {
      this.setState('paused');
    }
  }

  /**
   * 恢复游戏
   */
  public resumeGame(): void {
    if (this.currentState === 'paused') {
      this.setState('playing');
    }
  }

  /**
   * 游戏结束
   */
  public gameOver(): void {
    this.setState('gameOver');
  }

  /**
   * 返回菜单
   */
  public returnToMenu(): void {
    this.setState('menu');
  }

  /**
   * 检查是否在游戏中
   */
  public isPlaying(): boolean {
    return this.currentState === 'playing';
  }

  /**
   * 检查是否暂停
   */
  public isPaused(): boolean {
    return this.currentState === 'paused';
  }

  /**
   * 检查是否在菜单
   */
  public isInMenu(): boolean {
    return this.currentState === 'menu';
  }

  /**
   * 检查是否游戏结束
   */
  public isGameOver(): boolean {
    return this.currentState === 'gameOver';
  }

  /**
   * 注册状态变化回调
   * @param state 目标状态
   * @param callback 回调函数
   */
  public onStateChange(state: GameState, callback: () => void): void {
    this.stateChangeCallbacks.get(state)?.push(callback);
  }

  /**
   * 注册状态进入回调
   * @param state 目标状态
   * @param callback 回调函数
   */
  public onStateEnter(state: GameState, callback: () => void): void {
    this.stateEnterCallbacks.get(state)?.push(callback);
  }

  /**
   * 注册状态退出回调
   * @param state 目标状态
   * @param callback 回调函数
   */
  public onStateExit(state: GameState, callback: () => void): void {
    this.stateExitCallbacks.get(state)?.push(callback);
  }

  /**
   * 执行回调数组
   */
  private executeCallbacks(callbacks: Array<() => void>): void {
    for (const callback of callbacks) {
      callback();
    }
  }

  /**
   * 清理所有回调
   */
  public dispose(): void {
    this.stateChangeCallbacks.clear();
    this.stateEnterCallbacks.clear();
    this.stateExitCallbacks.clear();
  }
}
