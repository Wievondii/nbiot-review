/**
 * 物理世界封装
 * 封装 cannon-es 物理引擎，提供碰撞检测和物理模拟
 */
import * as CANNON from 'cannon-es';
import { IPhysicsWorld } from '../types/engine';

export class PhysicsWorld implements IPhysicsWorld {
  private world: CANNON.World;
  private bodies: CANNON.Body[] = [];

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;

    // 默认接触材质
    const defaultMaterial = new CANNON.Material('default');
    const defaultContact = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
      friction: 0.5,
      restitution: 0.3,
    });
    this.world.addContactMaterial(defaultContact);
    this.world.defaultContactMaterial = defaultContact;
  }

  /** 添加物理体 */
  addBody(body: CANNON.Body): void {
    this.world.addBody(body);
    this.bodies.push(body);
  }

  /** 移除物理体 */
  removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
    const index = this.bodies.indexOf(body);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  /** 物理步进 */
  step(deltaTime: number): void {
    this.world.step(1 / 60, deltaTime, 3);
  }

  /** 射线检测 */
  raycast(from: CANNON.Vec3, to: CANNON.Vec3): CANNON.RaycastResult | null {
    const result = new CANNON.RaycastResult();
    this.world.raycastClosest(from, to, {}, result);
    return result.hasHit ? result : null;
  }

  /** 获取底层物理世界 */
  getWorld(): CANNON.World {
    return this.world;
  }

  /** 获取所有物理体 */
  getBodies(): CANNON.Body[] {
    return this.bodies;
  }

  /** 释放资源 */
  dispose(): void {
    // 移除所有物理体
    for (const body of this.bodies) {
      this.world.removeBody(body);
    }
    this.bodies = [];
  }
}
