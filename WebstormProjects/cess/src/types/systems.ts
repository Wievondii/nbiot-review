/**
 * 游戏系统接口定义
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

/** 波次管理器接口 */
export interface IWaveManager {
  currentWave: number;
  zombiesRemaining: number;
  startWave(): void;
  onWaveComplete: () => void;
}

/** 得分管理器接口 */
export interface IScoreManager {
  score: number;
  highScore: number;
  addScore(points: number): void;
  saveHighScore(): void;
}

/** 输入管理器接口 */
export interface IInputManager {
  lockPointer(): void;
  unlockPointer(): void;
  isPointerLocked(): boolean;
  getKeyState(key: string): boolean;
  getMouseMovement(): { x: number; y: number };
}

/** 音频管理器接口 */
export interface IAudioManager {
  playSound(soundId: string): void;
  playMusic(musicId: string): void;
  stopMusic(): void;
  setVolume(volume: number): void;
}
