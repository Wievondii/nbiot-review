/**
 * 玩家实体
 * 实现第一人称视角的玩家控制，包括移动、碰撞、生命值
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { IPlayer } from '../types/entities';
import { PhysicsWorld } from '../engine/PhysicsWorld';
import { SceneManager } from '../engine/SceneManager';

/** 玩家配置 */
export interface PlayerConfig {
  /** 移动速度（单位/秒） */
  moveSpeed: number;
  /** 冲刺速度倍率 */
  sprintMultiplier: number;
  /** 跳跃力 */
  jumpForce: number;
  /** 最大生命值 */
  maxHealth: number;
  /** 玩家身高（碰撞体半径） */
  radius: number;
  /** 玩家身高 */
  height: number;
}

/** 默认玩家配置 */
const DEFAULT_CONFIG: PlayerConfig = {
  moveSpeed: 5,
  sprintMultiplier: 1.6,
  jumpForce: 5,
  maxHealth: 100,
  radius: 0.35,
  height: 1.7,
};

export class Player implements IPlayer {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  health: number;
  maxHealth: number;

  /** 玩家物理体 */
  private body: CANNON.Body;
  /** 相机引用 */
  private camera: THREE.PerspectiveCamera;
  /** 配置 */
  private config: PlayerConfig;
  /** 物理世界引用 */
  private physicsWorld: PhysicsWorld;
  /** 场景管理器引用 */
  private sceneManager: SceneManager;

  /** 鼠标灵敏度 */
  private mouseSensitivity: number = 0.002;
  /** 俯仰角限制（弧度） */
  private pitchLimit: number = Math.PI / 2 - 0.1;
  /** 当前俯仰角 */
  private pitch: number = 0;

  /** 是否在地面上 */
  private onGround: boolean = false;
  /** 冲刺状态 */
  private isSprinting: boolean = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    physicsWorld: PhysicsWorld,
    sceneManager: SceneManager,
    config: Partial<PlayerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.camera = camera;
    this.physicsWorld = physicsWorld;
    this.sceneManager = sceneManager;

    this.maxHealth = this.config.maxHealth;
    this.health = this.maxHealth;
    this.position = new THREE.Vector3(0, this.config.height, 0);
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');

    // 创建物理体（胶囊体用圆柱近似）
    this.body = new CANNON.Body({
      mass: 70, // 70kg
      position: new CANNON.Vec3(0, this.config.height, 0),
      shape: new CANNON.Cylinder(this.config.radius, this.config.radius, this.config.height, 8),
      linearDamping: 0.9, // 阻尼防止滑行
      angularDamping: 1.0,
      fixedRotation: true, // 禁止旋转
    });

    // 防止休眠
    this.body.allowSleep = false;
    this.physicsWorld.addBody(this.body);

    // 监听碰撞（判断是否在地面）
    this.body.addEventListener('collide', this.onCollision.bind(this));
  }

  /** 碰撞回调 - 判断是否着地 */
  private onCollision(event: { contact: { ni: { y: number } } | null }): void {
    const contact = event.contact;
    if (contact) {
      // 检查碰撞法线是否朝上（说明踩在物体上）
      const normalY = contact.ni.y;
      if (normalY > 0.5) {
        this.onGround = true;
      }
    }
  }

  /** 移动玩家 */
  move(direction: THREE.Vector3, speed: number): void {
    const actualSpeed = this.isSprinting ? speed * this.config.sprintMultiplier : speed;

    // 将方向转换到物理世界
    const force = new CANNON.Vec3(
      direction.x * actualSpeed * 50,
      0,
      direction.z * actualSpeed * 50
    );

    this.body.applyForce(force, this.body.position);
  }

  /** 跳跃 */
  jump(): void {
    if (this.onGround) {
      this.body.velocity.y = this.config.jumpForce;
      this.onGround = false;
    }
  }

  /** 设置冲刺状态 */
  setSprinting(sprinting: boolean): void {
    this.isSprinting = sprinting;
  }

  /** 旋转视角 */
  rotate(x: number, y: number): void {
    // x = 左右旋转（yaw），y = 上下旋转（pitch）
    this.rotation.y -= x * this.mouseSensitivity;
    this.pitch -= y * this.mouseSensitivity;
    this.pitch = Math.max(-this.pitchLimit, Math.min(this.pitchLimit, this.pitch));
    this.rotation.x = this.pitch;
  }

  /** 受到伤害 */
  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  /** 治疗 */
  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /** 是否存活 */
  isAlive(): boolean {
    return this.health > 0;
  }

  /** 更新玩家状态（每帧调用） */
  update(_deltaTime: number): void {
    // 同步物理位置到 Three.js
    this.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );

    // 限制水平速度防止超速
    const maxVel = this.isSprinting
      ? this.config.moveSpeed * this.config.sprintMultiplier * 1.2
      : this.config.moveSpeed * 1.2;
    const hVel = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.z ** 2);
    if (hVel > maxVel) {
      const scale = maxVel / hVel;
      this.body.velocity.x *= scale;
      this.body.velocity.z *= scale;
    }

    // 更新相机位置和旋转
    this.camera.position.copy(this.position);
    this.camera.rotation.copy(this.rotation);
  }

  /** 获取相机方向（水平面） */
  getForwardDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    return dir.normalize();
  }

  /** 获取右侧方向 */
  getRightDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3(1, 0, 0);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
    return dir.normalize();
  }

  /** 重置玩家 */
  reset(): void {
    this.health = this.maxHealth;
    this.body.position.set(0, this.config.height, 0);
    this.body.velocity.set(0, 0, 0);
    this.rotation.set(0, 0, 0, 'YXZ');
    this.pitch = 0;
    this.onGround = false;
  }

  /** 释放资源 */
  dispose(): void {
    this.physicsWorld.removeBody(this.body);
  }
}
