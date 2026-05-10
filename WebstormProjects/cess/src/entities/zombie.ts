/**
 * 僵尸实体系统
 * 实现IZombie接口，包含模型创建、动画系统和AI逻辑
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { IZombie, ZombieState } from '../types';
import { PhysicsWorld } from '../engine/PhysicsWorld';

/** 僵尸配置参数 */
interface ZombieConfig {
  health: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
}

/** 默认僵尸配置 */
const DEFAULT_ZOMBIE_CONFIG: ZombieConfig = {
  health: 100,
  speed: 2.0,
  damage: 10,
  attackRange: 1.5,
  attackCooldown: 1.0,
};

/**
 * 僵尸实体类
 * 实现IZombie接口，提供完整的僵尸行为
 */
export class Zombie implements IZombie {
  public id: string;
  public position: THREE.Vector3;
  public health: number;
  public speed: number;
  public damage: number;
  public state: ZombieState;

  /** 3D模型组 */
  public mesh: THREE.Group;

  /** 物理碰撞体 */
  public body: CANNON.Body;

  /** 僵尸配置 */
  private config: ZombieConfig;

  /** 物理世界引用 */
  private physicsWorld: PhysicsWorld;

  /** 动画相关 */
  private animationMixer: THREE.AnimationMixer | null = null;
  private currentAnimation: string | null = null;

  /** AI状态 */
  private targetPosition: THREE.Vector3 | null = null;
  private attackTimer: number = 0;
  private isAttacking: boolean = false;

  /** 攻击动画计时器 */
  private attackAnimationTimer: number = 0;
  private readonly ATTACK_ANIMATION_DURATION: number = 0.3;

  /** 受伤闪烁计时器 */
  private flashTimer: number = 0;
  private readonly FLASH_DURATION: number = 0.1;
  private isFlashing: boolean = false;

  /** 死亡动画计时器 */
  private deathTimer: number = 0;
  private readonly DEATH_DURATION: number = 2.0;

  /** 路径点 */
  private pathPoints: THREE.Vector3[] = [];
  private currentPathIndex: number = 0;

  /** 肢体部件引用 */
  private leftArm: THREE.Mesh | null = null;
  private rightArm: THREE.Mesh | null = null;
  private leftLeg: THREE.Mesh | null = null;
  private rightLeg: THREE.Mesh | null = null;

  /**
   * 创建僵尸实例
   * @param id 僵尸唯一标识
   * @param position 初始位置
   * @param physicsWorld 物理世界引用
   * @param config 可选配置覆盖
   */
  constructor(id: string, position: THREE.Vector3, physicsWorld: PhysicsWorld, config?: Partial<ZombieConfig>) {
    this.id = id;
    this.position = position.clone();
    this.physicsWorld = physicsWorld;
    this.config = { ...DEFAULT_ZOMBIE_CONFIG, ...config };
    this.health = this.config.health;
    this.speed = this.config.speed;
    this.damage = this.config.damage;
    this.state = ZombieState.IDLE;

    // 创建僵尸3D模型
    this.mesh = this.createZombieModel();
    this.mesh.position.copy(this.position);

    // 创建物理碰撞体
    this.body = this.createPhysicsBody();
    this.physicsWorld.addBody(this.body);
  }

  /**
   * 创建物理碰撞体
   */
  private createPhysicsBody(): CANNON.Body {
    // 使用圆柱体作为僵尸碰撞体
    const radius = 0.3;
    const height = 1.8;

    const body = new CANNON.Body({
      mass: 80, // 80kg
      position: new CANNON.Vec3(this.position.x, height / 2, this.position.z),
      shape: new CANNON.Cylinder(radius, radius, height, 8),
      linearDamping: 0.9,
      angularDamping: 1.0,
      fixedRotation: true, // 禁止旋转
    });

    // 防止休眠
    body.allowSleep = false;

    // 设置碰撞分组
    body.collisionFilterGroup = 2; // 僵尸组
    body.collisionFilterMask = 1 | 4; // 与玩家(1)和障碍物(4)碰撞

    return body;
  }

  /**
   * 创建僵尸3D模型
   * 使用基础几何体组合创建人形僵尸
   */
  private createZombieModel(): THREE.Group {
    const zombieGroup = new THREE.Group();

    // 僵尸颜色方案 - 暗绿色皮肤
    const skinColor = 0x3a5a27;
    const clothesColor = 0x2d2d2d;
    const eyeColor = 0xff0000;

    // 头部
    const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const headMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.6;
    head.castShadow = true;
    zombieGroup.add(head);

    // 眼睛
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshLambertMaterial({ color: eyeColor, emissive: eyeColor });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.65, 0.2);
    zombieGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.65, 0.2);
    zombieGroup.add(rightEye);

    // 身体
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: clothesColor });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.1;
    body.castShadow = true;
    zombieGroup.add(body);

    // 左臂
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
    this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
    this.leftArm.position.set(-0.45, 1.2, 0);
    this.leftArm.rotation.x = -0.5; // 向前伸
    this.leftArm.castShadow = true;
    zombieGroup.add(this.leftArm);

    // 右臂
    this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
    this.rightArm.position.set(0.45, 1.2, 0);
    this.rightArm.rotation.x = -0.5;
    this.rightArm.castShadow = true;
    zombieGroup.add(this.rightArm);

    // 左腿
    const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const legMaterial = new THREE.MeshLambertMaterial({ color: clothesColor });
    this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.leftLeg.position.set(-0.15, 0.5, 0);
    this.leftLeg.castShadow = true;
    zombieGroup.add(this.leftLeg);

    // 右腿
    this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    this.rightLeg.position.set(0.15, 0.5, 0);
    this.rightLeg.castShadow = true;
    zombieGroup.add(this.rightLeg);

    return zombieGroup;
  }

  /**
   * 更新僵尸状态
   * @param deltaTime 帧间隔时间（秒）
   * @param playerPosition 玩家位置
   */
  public update(deltaTime: number, playerPosition: THREE.Vector3): void {
    // 同步物理体位置到position
    this.position.set(
      this.body.position.x,
      this.body.position.y - 0.9, // 调整到脚底位置
      this.body.position.z
    );

    // 死亡状态不更新
    if (this.state === ZombieState.DEAD) {
      this.updateDeathAnimation(deltaTime);
      return;
    }

    // 更新攻击冷却
    if (this.attackTimer > 0) {
      this.attackTimer -= deltaTime;
    }

    // 更新受伤闪烁
    if (this.isFlashing) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.isFlashing = false;
        // 恢复原始颜色
        this.restoreOriginalColors();
      }
    }

    // 更新攻击动画
    if (this.isAttacking) {
      this.attackAnimationTimer -= deltaTime;
      if (this.attackAnimationTimer <= 0) {
        this.isAttacking = false;
        // 恢复手臂位置
        if (this.leftArm) this.leftArm.rotation.x = -0.5;
        if (this.rightArm) this.rightArm.rotation.x = -0.5;
      }
    }

    // 计算与玩家的距离
    const distanceToPlayer = this.position.distanceTo(playerPosition);

    // AI决策
    if (distanceToPlayer <= this.config.attackRange) {
      this.enterAttackState(playerPosition, deltaTime);
    } else if (distanceToPlayer < 20) {
      this.enterWalkState(playerPosition, deltaTime);
    } else {
      this.enterIdleState();
    }

    // 更新动画
    this.updateAnimation(deltaTime);

    // 同步模型位置
    this.mesh.position.copy(this.position);
  }

  /**
   * 进入空闲状态
   */
  private enterIdleState(): void {
    if (this.state !== ZombieState.IDLE) {
      this.state = ZombieState.IDLE;
      this.isAttacking = false;
    }
  }

  /**
   * 进入行走状态，向玩家移动
   */
  private enterWalkState(playerPosition: THREE.Vector3, _deltaTime: number): void {
    this.state = ZombieState.WALKING;

    // 计算移动方向
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();

    // 通过物理体移动
    const force = new CANNON.Vec3(
      direction.x * this.speed * 50,
      0,
      direction.z * this.speed * 50
    );
    this.body.applyForce(force, this.body.position);

    // 让僵尸面向玩家
    const angle = Math.atan2(direction.x, direction.z);
    this.mesh.rotation.y = angle;
  }

  /**
   * 进入攻击状态
   */
  private enterAttackState(playerPosition: THREE.Vector3, deltaTime: number): void {
    this.state = ZombieState.ATTACKING;

    // 面向玩家
    const direction = new THREE.Vector3()
      .subVectors(playerPosition, this.position)
      .normalize();
    const angle = Math.atan2(direction.x, direction.z);
    this.mesh.rotation.y = angle;

    // 攻击逻辑
    if (this.attackTimer <= 0 && !this.isAttacking) {
      this.isAttacking = true;
      this.attackTimer = this.config.attackCooldown;

      // 攻击动画
      this.playAttackAnimation();

      // 返回伤害信息，由外部处理
      // 这里不直接修改玩家生命值，而是返回攻击事件
    }
  }

  /**
   * 播放攻击动画
   */
  private playAttackAnimation(): void {
    // 攻击动画 - 手臂前伸
    if (this.leftArm) this.leftArm.rotation.x = -1.2;
    if (this.rightArm) this.rightArm.rotation.x = -1.2;

    // 设置动画计时器
    this.attackAnimationTimer = this.ATTACK_ANIMATION_DURATION;
  }

  /**
   * 更新行走动画
   */
  private updateAnimation(_deltaTime: number): void {
    if (this.state === ZombieState.WALKING) {
      // 腿部摆动动画
      if (this.leftLeg && this.rightLeg) {
        const walkCycle = Math.sin(Date.now() * 0.008) * 0.3;
        this.leftLeg.rotation.x = walkCycle;
        this.rightLeg.rotation.x = -walkCycle;
      }

      // 手臂摆动
      if (this.leftArm && this.rightArm) {
        const armCycle = Math.sin(Date.now() * 0.008) * 0.2;
        this.leftArm.rotation.x = -0.5 + armCycle;
        this.rightArm.rotation.x = -0.5 - armCycle;
      }
    }
  }

  /**
   * 更新死亡动画
   */
  private updateDeathAnimation(deltaTime: number): void {
    if (this.deathTimer < this.DEATH_DURATION) {
      this.deathTimer += deltaTime;

      // 倒地动画
      const progress = Math.min(this.deathTimer / 1.0, 1.0);
      this.mesh.rotation.x = progress * Math.PI / 2;

      // 逐渐下沉
      if (this.deathTimer > 1.0) {
        const sinkProgress = (this.deathTimer - 1.0) / 1.0;
        this.mesh.position.y -= sinkProgress * deltaTime * 2;
      }
    }
  }

  /**
   * 受到伤害
   * @param amount 伤害值
   */
  public takeDamage(amount: number): void {
    if (this.state === ZombieState.DEAD) return;

    this.health -= amount;

    // 受伤闪烁效果
    this.flashDamage();

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * 死亡处理
   */
  private die(): void {
    this.state = ZombieState.DEAD;
    this.deathTimer = 0;

    // 禁用碰撞
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
      }
    });
  }

  /**
   * 受伤闪烁效果
   */
  private flashDamage(): void {
    this.isFlashing = true;
    this.flashTimer = this.FLASH_DURATION;

    // 变红
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshLambertMaterial;
        // 保存原始颜色到userData
        if (!child.userData.originalColor) {
          child.userData.originalColor = material.color.clone();
        }
        material.color.set(0xff0000);
      }
    });
  }

  /**
   * 恢复原始颜色
   */
  private restoreOriginalColors(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && child.userData.originalColor) {
        const material = child.material as THREE.MeshLambertMaterial;
        material.color.copy(child.userData.originalColor);
      }
    });
  }

  /**
   * 检查僵尸是否存活
   */
  public isAlive(): boolean {
    return this.state !== ZombieState.DEAD;
  }

  /**
   * 获取僵尸包围盒（用于碰撞检测）
   */
  public getBoundingBox(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this.mesh);
  }

  /**
   * 释放资源
   */
  public dispose(): void {
    // 移除物理体
    this.physicsWorld.removeBody(this.body);

    // 释放3D模型资源
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
  }
}

/**
 * 僵尸工厂
 * 用于批量创建僵尸
 */
export class ZombieFactory {
  private static zombieIdCounter: number = 0;

  /**
   * 创建僵尸
   * @param position 生成位置
   * @param physicsWorld 物理世界引用
   * @param config 可选配置
   */
  public static createZombie(position: THREE.Vector3, physicsWorld: PhysicsWorld, config?: Partial<ZombieConfig>): Zombie {
    const id = `zombie_${ZombieFactory.zombieIdCounter++}`;
    return new Zombie(id, position, physicsWorld, config);
  }

  /**
   * 在指定区域内生成僵尸
   * @param center 中心位置
   * @param radius 半径
   * @param count 数量
   * @param physicsWorld 物理世界引用
   * @param config 可选配置
   */
  public static spawnZombiesInArea(
    center: THREE.Vector3,
    radius: number,
    count: number,
    physicsWorld: PhysicsWorld,
    config?: Partial<ZombieConfig>
  ): Zombie[] {
    const zombies: Zombie[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;

      const position = new THREE.Vector3(
        center.x + Math.cos(angle) * distance,
        0,
        center.z + Math.sin(angle) * distance
      );

      zombies.push(ZombieFactory.createZombie(position, physicsWorld, config));
    }

    return zombies;
  }

  /**
   * 重置ID计数器
   */
  public static resetIdCounter(): void {
    ZombieFactory.zombieIdCounter = 0;
  }
}
