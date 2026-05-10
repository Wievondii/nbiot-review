/**
 * 武器系统
 * 实现射击、换弹、伤害计算
 */
import * as THREE from 'three';
import { IWeapon } from '../types/entities';
import { Raycaster, RaycastHit } from '../engine/Raycaster';

/** 武器类型枚举 */
export enum WeaponType {
  PISTOL = 'pistol',
  SHOTGUN = 'shotgun',
  RIFLE = 'rifle',
}

/** 武器配置 */
export interface WeaponConfig {
  name: string;
  damage: number;
  fireRate: number; // 每秒射击次数
  maxAmmo: number;
  reloadTime: number; // 秒
  spread: number; // 散布角度（弧度）
  range: number; // 射程
  /** 霰弹枪弹丸数 */
  pellets?: number;
}

/** 武器预设配置 */
const WEAPON_PRESETS: Record<WeaponType, WeaponConfig> = {
  [WeaponType.PISTOL]: {
    name: '手枪',
    damage: 25,
    fireRate: 3,
    maxAmmo: 12,
    reloadTime: 1.5,
    spread: 0.02,
    range: 80,
  },
  [WeaponType.SHOTGUN]: {
    name: '霰弹枪',
    damage: 50,
    fireRate: 1,
    maxAmmo: 6,
    reloadTime: 2.5,
    spread: 0.1,
    range: 30,
    pellets: 8,
  },
  [WeaponType.RIFLE]: {
    name: '步枪',
    damage: 35,
    fireRate: 8,
    maxAmmo: 30,
    reloadTime: 2.0,
    spread: 0.03,
    range: 100,
  },
};

export class Weapon implements IWeapon {
  name: string;
  damage: number;
  fireRate: number;
  ammo: number;
  maxAmmo: number;

  /** 武器类型 */
  type: WeaponType;
  /** 武器配置 */
  private config: WeaponConfig;
  /** 射击计时器 */
  private fireTimer: number = 0;
  /** 是否正在换弹 */
  private reloading: boolean = false;
  /** 换弹计时器 */
  private reloadTimer: number = 0;
  /** 射线检测器引用 */
  private raycaster: Raycaster;

  constructor(type: WeaponType, raycaster: Raycaster) {
    this.type = type;
    this.config = WEAPON_PRESETS[type];
    this.raycaster = raycaster;

    this.name = this.config.name;
    this.damage = this.config.damage;
    this.fireRate = this.config.fireRate;
    this.maxAmmo = this.config.maxAmmo;
    this.ammo = this.maxAmmo;
  }

  /** 射击 */
  fire(): boolean {
    // 检查是否可以射击
    if (this.reloading) return false;
    if (this.fireTimer > 0) return false;
    if (this.ammo <= 0) return false;

    this.ammo--;
    this.fireTimer = 1 / this.fireRate;

    return true;
  }

  /**
   * 执行射击射线检测
   * @param camera 相机（用于获取射击方向）
   * @returns 命中结果数组
   */
  fireWithRaycast(camera: THREE.Camera): RaycastHit[] {
    if (!this.fire()) return [];

    const results: RaycastHit[] = [];
    const pellets = this.config.pellets || 1;

    for (let i = 0; i < pellets; i++) {
      // 添加散布
      const spreadX = (Math.random() - 0.5) * this.config.spread;
      const spreadY = (Math.random() - 0.5) * this.config.spread;

      const direction = new THREE.Vector3(spreadX, spreadY, -1);
      direction.applyQuaternion(camera.quaternion);
      direction.normalize();

      const origin = camera.position.clone();
      const result = this.raycaster.shootRay(origin, direction, this.config.range);
      results.push(result);
    }

    // 自动换弹
    if (this.ammo <= 0) {
      this.reload();
    }

    return results;
  }

  /** 换弹 */
  reload(): void {
    if (this.reloading) return;
    if (this.ammo >= this.maxAmmo) return;

    this.reloading = true;
    this.reloadTimer = this.config.reloadTime;
  }

  /** 是否正在换弹 */
  isReloading(): boolean {
    return this.reloading;
  }

  /** 获取换弹进度 (0-1) */
  getReloadProgress(): number {
    if (!this.reloading) return 1;
    return 1 - (this.reloadTimer / this.config.reloadTime);
  }

  /** 更新武器状态（每帧调用） */
  update(deltaTime: number): void {
    // 更新射击冷却
    if (this.fireTimer > 0) {
      this.fireTimer -= deltaTime;
      if (this.fireTimer < 0) this.fireTimer = 0;
    }

    // 更新换弹
    if (this.reloading) {
      this.reloadTimer -= deltaTime;
      if (this.reloadTimer <= 0) {
        this.ammo = this.maxAmmo;
        this.reloading = false;
        this.reloadTimer = 0;
      }
    }
  }

  /** 切换武器时重置状态 */
  reset(): void {
    this.fireTimer = 0;
    this.reloading = false;
    this.reloadTimer = 0;
    this.ammo = this.maxAmmo;
  }
}
