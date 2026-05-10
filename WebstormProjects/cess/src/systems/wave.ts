/**
 * 波次管理系统
 * 实现IWaveManager接口，管理僵尸波次生成和难度递增
 */

import * as THREE from 'three';
import { IWaveManager } from '../types';
import { Zombie, ZombieFactory } from '../entities/zombie';
import { PhysicsWorld } from '../engine/PhysicsWorld';

/** 波次配置 */
interface WaveConfig {
  /** 初始僵尸数量 */
  initialZombieCount: number;
  /** 每波增加僵尸数量 */
  zombieCountIncrement: number;
  /** 僵尸生成半径 */
  spawnRadius: number;
  /** 波次间等待时间（秒） */
  waveInterval: number;
  /** 僵尸速度递增因子 */
  speedMultiplierPerWave: number;
  /** 僵尸生命值递增因子 */
  healthMultiplierPerWave: number;
}

/** 默认波次配置 */
const DEFAULT_WAVE_CONFIG: WaveConfig = {
  initialZombieCount: 5,
  zombieCountIncrement: 3,
  spawnRadius: 15,
  waveInterval: 5.0,
  speedMultiplierPerWave: 0.1,
  healthMultiplierPerWave: 0.15,
};

/**
 * 波次管理器
 * 负责僵尸的波次生成、难度递增和波次状态管理
 */
export class WaveManager implements IWaveManager {
  /** 当前波次 */
  public currentWave: number = 0;

  /** 剩余僵尸数量 */
  public zombiesRemaining: number = 0;

  /** 波次完成回调 */
  public onWaveComplete: () => void = () => {};

  /** 当前波次的所有僵尸 */
  private zombies: Zombie[] = [];

  /** 波次配置 */
  private config: WaveConfig;

  /** 波次状态 */
  private isWaveActive: boolean = false;

  /** 波次间等待计时器 */
  private waveIntervalTimer: number = 0;

  /** 生成中心点（玩家位置） */
  private spawnCenter: THREE.Vector3;

  /** 场景引用，用于添加/移除僵尸模型 */
  private scene: THREE.Scene | null = null;

  /** 物理世界引用 */
  private physicsWorld: PhysicsWorld;

  /**
   * 创建波次管理器
   * @param scene Three.js场景
   * @param physicsWorld 物理世界引用
   * @param spawnCenter 生成中心点
   * @param config 可选配置覆盖
   */
  constructor(
    scene: THREE.Scene,
    physicsWorld: PhysicsWorld,
    spawnCenter: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
    config?: Partial<WaveConfig>
  ) {
    this.scene = scene;
    this.physicsWorld = physicsWorld;
    this.spawnCenter = spawnCenter.clone();
    this.config = { ...DEFAULT_WAVE_CONFIG, ...config };
  }

  /**
   * 开始下一波
   */
  public startWave(): void {
    this.currentWave++;
    this.isWaveActive = true;

    // 计算本波僵尸数量
    const zombieCount = this.calculateZombieCount();

    // 计算本波难度系数
    const difficultyMultiplier = this.calculateDifficultyMultiplier();

    // 生成僵尸
    this.spawnZombies(zombieCount, difficultyMultiplier);

    // 更新剩余数量
    this.zombiesRemaining = this.zombies.length;

    console.log(`[WaveManager] 第 ${this.currentWave} 波开始！僵尸数量: ${zombieCount}`);
  }

  /**
   * 计算当前波次僵尸数量
   */
  private calculateZombieCount(): number {
    return this.config.initialZombieCount + 
           (this.currentWave - 1) * this.config.zombieCountIncrement;
  }

  /**
   * 计算难度系数
   */
  private calculateDifficultyMultiplier(): number {
    return 1 + (this.currentWave - 1) * this.config.speedMultiplierPerWave;
  }

  /**
   * 生成僵尸
   * @param count 数量
   * @param difficultyMultiplier 难度系数
   */
  private spawnZombies(count: number, difficultyMultiplier: number): void {
    // 清除现有僵尸
    this.clearZombies();

    // 计算生成区域（围绕玩家周围）
    const spawnCenter = this.spawnCenter.clone();

    // 创建僵尸配置
    const zombieConfig = {
      speed: 2.0 * difficultyMultiplier,
      health: 100 * (1 + (this.currentWave - 1) * this.config.healthMultiplierPerWave),
    };

    // 批量生成僵尸，传递物理世界和难度配置
    this.zombies = ZombieFactory.spawnZombiesInArea(
      spawnCenter,
      this.config.spawnRadius,
      count,
      this.physicsWorld,
      zombieConfig
    );

    // 将僵尸添加到场景
    this.zombies.forEach((zombie) => {
      if (this.scene) {
        this.scene.add(zombie.mesh);
      }
    });
  }

  /**
   * 更新波次状态
   * @param deltaTime 帧间隔时间（秒）
   * @param playerPosition 玩家位置
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // 更新生成中心点
    this.spawnCenter.copy(playerPosition);

    // 更新所有僵尸
    this.zombies.forEach((zombie) => {
      zombie.update(deltaTime, playerPosition);
    });

    // 统计存活僵尸
    const aliveZombies = this.zombies.filter((z) => z.isAlive());
    this.zombiesRemaining = aliveZombies.length;

    // 检查波次是否完成
    if (this.isWaveActive && aliveZombies.length === 0) {
      this.completeWave();
    }

    // 波次间等待
    if (!this.isWaveActive && this.currentWave > 0) {
      this.waveIntervalTimer -= deltaTime;
      if (this.waveIntervalTimer <= 0) {
        this.startWave();
      }
    }
  }

  /**
   * 完成当前波次
   */
  private completeWave(): void {
    this.isWaveActive = false;
    this.waveIntervalTimer = this.config.waveInterval;

    console.log(`[WaveManager] 第 ${this.currentWave} 波完成！`);

    // 触发回调
    if (this.onWaveComplete) {
      this.onWaveComplete();
    }
  }

  /**
   * 清除所有僵尸
   */
  private clearZombies(): void {
    this.zombies.forEach((zombie) => {
      if (this.scene) {
        this.scene.remove(zombie.mesh);
      }
      zombie.dispose();
    });
    this.zombies = [];
  }

  /**
   * 获取所有僵尸（用于碰撞检测）
   */
  public getZombies(): Zombie[] {
    return this.zombies;
  }

  /**
   * 获取存活僵尸
   */
  public getAliveZombies(): Zombie[] {
    return this.zombies.filter((z) => z.isAlive());
  }

  /**
   * 处理僵尸受到伤害
   * @param zombieId 僵尸ID
   * @param damage 伤害值
   * @returns 是否击杀
   */
  public damageZombie(zombieId: string, damage: number): boolean {
    const zombie = this.zombies.find((z) => z.id === zombieId);
    if (zombie && zombie.isAlive()) {
      zombie.takeDamage(damage);
      return !zombie.isAlive();
    }
    return false;
  }

  /**
   * 检查点是否击中僵尸
   * @param raycaster 射线投射器
   * @returns 击中的僵尸信息
   */
  public checkZombieHit(raycaster: THREE.Raycaster): { zombie: Zombie; distance: number } | null {
    const aliveZombies = this.getAliveZombies();
    let closestHit: { zombie: Zombie; distance: number } | null = null;

    aliveZombies.forEach((zombie) => {
      const intersects = raycaster.intersectObject(zombie.mesh, true);
      if (intersects.length > 0) {
        const distance = intersects[0].distance;
        if (!closestHit || distance < closestHit.distance) {
          closestHit = { zombie, distance };
        }
      }
    });

    return closestHit;
  }

  /**
   * 重置波次管理器
   */
  public reset(): void {
    this.clearZombies();
    this.currentWave = 0;
    this.zombiesRemaining = 0;
    this.isWaveActive = false;
    this.waveIntervalTimer = 0;
    ZombieFactory.resetIdCounter();
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    this.reset();
  }
}
