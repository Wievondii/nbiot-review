/**
 * 游戏实体接口定义
 */
import * as THREE from 'three';

/** 玩家接口 */
export interface IPlayer {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  health: number;
  maxHealth: number;
  move(direction: THREE.Vector3, speed: number): void;
  rotate(x: number, y: number): void;
  takeDamage(amount: number): void;
  heal(amount: number): void;
}

/** 僵尸状态枚举 */
export enum ZombieState {
  IDLE = 'idle',
  WALKING = 'walking',
  ATTACKING = 'attacking',
  DEAD = 'dead',
}

/** 僵尸接口 */
export interface IZombie {
  id: string;
  position: THREE.Vector3;
  health: number;
  speed: number;
  damage: number;
  state: ZombieState;
  update(deltaTime: number, playerPosition: THREE.Vector3): void;
  takeDamage(amount: number): void;
}

/** 武器接口 */
export interface IWeapon {
  name: string;
  damage: number;
  fireRate: number; // 每秒射击次数
  ammo: number;
  maxAmmo: number;
  reload(): void;
  fire(): boolean;
}
