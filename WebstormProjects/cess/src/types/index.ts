/**
 * 游戏类型定义汇总
 * 所有 Developer 共享的接口和类型
 */
export * from './engine';
export * from './entities';
export * from './systems';
export * from './game';

// ==================== UI接口 ====================
import type { IGame } from './game';

export interface IUIManager {
  init(game: IGame): void;
  showMenu(): void;
  hideMenu(): void;
  showHUD(): void;
  hideHUD(): void;
  showPauseMenu(): void;
  hidePauseMenu(): void;
  showGameOver(score: number, highScore: number): void;
  hideGameOver(): void;
  updateHUD(health: number, ammo: number, maxAmmo: number, score: number): void;
  updateWaveInfo(wave: number, zombiesRemaining: number): void;
  showMessage(message: string, duration?: number): void;
  dispose(): void;
}

// ==================== 音效ID常量 ====================
export const SoundIds = {
  // 武器音效
  PISTOL_FIRE: 'pistol_fire',
  SHOTGUN_FIRE: 'shotgun_fire',
  RIFLE_FIRE: 'rifle_fire',
  RELOAD: 'reload',
  EMPTY_CLIP: 'empty_clip',

  // 僵尸音效
  ZOMBIE_GROWL: 'zombie_growl',
  ZOMBIE_ATTACK: 'zombie_attack',
  ZOMBIE_DEATH: 'zombie_death',
  ZOMBIE_HIT: 'zombie_hit',

  // UI音效
  MENU_CLICK: 'menu_click',
  MENU_HOVER: 'menu_hover',
  WAVE_START: 'wave_start',
  WAVE_COMPLETE: 'wave_complete',
  GAME_OVER: 'game_over',
  PLAYER_HURT: 'player_hurt',

  // 背景音乐
  MUSIC_MENU: 'music_menu',
  MUSIC_GAME: 'music_game',
} as const;

export type SoundId = typeof SoundIds[keyof typeof SoundIds];

// ==================== 得分常量 ====================
export const ScoreValues = {
  ZOMBIE_KILL: 100,
  ZOMBIE_HEADSHOT: 250,
  WAVE_BONUS_BASE: 500,
  WAVE_BONUS_MULTIPLIER: 1.5,
  SURVIVAL_BONUS: 50,
} as const;
