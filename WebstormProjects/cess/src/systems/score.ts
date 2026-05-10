/**
 * 得分管理器
 * 负责游戏分数计算、高分记录和本地存储
 */
import { IScoreManager, ScoreValues } from '../types';

/** 本地存储键名 */
const STORAGE_KEY_HIGH_SCORE = 'zombie_fps_high_score';

export class ScoreManager implements IScoreManager {
  /** 当前分数 */
  score: number = 0;

  /** 最高分 */
  highScore: number = 0;

  /** 连杀计数器 */
  private comboCount: number = 0;

  /** 连杀计时器（毫秒） */
  private comboTimer: number = 0;

  /** 连杀超时时间（毫秒） */
  private readonly COMBO_TIMEOUT: number = 3000;

  /** 连杀倍率 */
  private readonly COMBO_MULTIPLIER: number = 0.1;

  constructor() {
    this.loadHighScore();
  }

  /**
   * 添加分数
   * @param points 基础分数
   */
  addScore(points: number): void {
    // 计算连杀加成
    this.comboCount++;
    this.comboTimer = Date.now();

    const comboBonus = Math.floor(points * this.comboCount * this.COMBO_MULTIPLIER);
    const totalPoints = points + comboBonus;

    this.score += totalPoints;

    // 更新最高分
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    console.log(`[Score] +${totalPoints} (基础:${points} 连杀加成:${comboBonus}) 连杀数:${this.comboCount}`);
  }

  /**
   * 添加僵尸击杀得分
   * @param isHeadshot 是否爆头
   */
  addKillScore(isHeadshot: boolean = false): void {
    const baseScore = isHeadshot ? ScoreValues.ZOMBIE_HEADSHOT : ScoreValues.ZOMBIE_KILL;
    this.addScore(baseScore);
  }

  /**
   * 添加波次奖励
   * @param waveNumber 波次编号
   */
  addWaveBonus(waveNumber: number): void {
    const bonus = Math.floor(
      ScoreValues.WAVE_BONUS_BASE * Math.pow(ScoreValues.WAVE_BONUS_MULTIPLIER, waveNumber - 1)
    );
    this.addScore(bonus);
    console.log(`[Score] 波次 ${waveNumber} 奖励: +${bonus}`);
  }

  /**
   * 添加生存奖励
   */
  addSurvivalBonus(): void {
    this.addScore(ScoreValues.SURVIVAL_BONUS);
  }

  /**
   * 更新连杀计时器
   * 应在游戏循环中调用
   */
  updateCombo(): void {
    if (this.comboCount > 0 && Date.now() - this.comboTimer > this.COMBO_TIMEOUT) {
      if (this.comboCount >= 3) {
        console.log(`[Score] 连杀结束: ${this.comboCount}连杀`);
      }
      this.comboCount = 0;
    }
  }

  /**
   * 获取当前连杀数
   */
  getComboCount(): number {
    return this.comboCount;
  }

  /**
   * 获取当前分数
   */
  getScore(): number {
    return this.score;
  }

  /**
   * 获取最高分
   */
  getHighScore(): number {
    return this.highScore;
  }

  /**
   * 重置分数（新游戏时调用）
   */
  resetScore(): void {
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
  }

  /**
   * 保存最高分到本地存储
   */
  saveHighScore(): void {
    try {
      localStorage.setItem(STORAGE_KEY_HIGH_SCORE, this.highScore.toString());
      console.log(`[Score] 高分已保存: ${this.highScore}`);
    } catch (e) {
      console.warn('[Score] 保存高分失败:', e);
    }
  }

  /**
   * 从本地存储加载最高分
   */
  private loadHighScore(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
        console.log(`[Score] 加载高分: ${this.highScore}`);
      }
    } catch (e) {
      console.warn('[Score] 加载高分失败:', e);
      this.highScore = 0;
    }
  }

  /**
   * 清除所有记录
   */
  clearAll(): void {
    this.score = 0;
    this.highScore = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    try {
      localStorage.removeItem(STORAGE_KEY_HIGH_SCORE);
    } catch (e) {
      // 忽略错误
    }
  }
}
