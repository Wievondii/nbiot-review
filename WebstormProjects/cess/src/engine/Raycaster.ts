/**
 * 射线检测系统
 * 用于子弹命中判定和视线检测
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from './PhysicsWorld';

/** 射线检测结果 */
export interface RaycastHit {
  /** 是否命中 */
  hit: boolean;
  /** 命中点（世界坐标） */
  point: THREE.Vector3;
  /** 命中法线 */
  normal: THREE.Vector3;
  /** 距离 */
  distance: number;
  /** 命中的物理体 */
  body: CANNON.Body | null;
}

export class Raycaster {
  private threeRaycaster: THREE.Raycaster;
  private physicsWorld: PhysicsWorld;

  constructor(physicsWorld: PhysicsWorld) {
    this.threeRaycaster = new THREE.Raycaster();
    this.physicsWorld = physicsWorld;
  }

  /**
   * 从相机方向发射射线（用于射击）
   * @param origin 射线起点
   * @param direction 射线方向
   * @param maxDistance 最大射程
   * @returns 命中结果
   */
  shootRay(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = 100): RaycastHit {
    const from = new CANNON.Vec3(origin.x, origin.y, origin.z);
    const to = new CANNON.Vec3(
      origin.x + direction.x * maxDistance,
      origin.y + direction.y * maxDistance,
      origin.z + direction.z * maxDistance
    );

    const result = this.physicsWorld.raycast(from, to);

    if (result) {
      return {
        hit: true,
        point: new THREE.Vector3(result.hitPointWorld.x, result.hitPointWorld.y, result.hitPointWorld.z),
        normal: new THREE.Vector3(result.hitNormalWorld.x, result.hitNormalWorld.y, result.hitNormalWorld.z),
        distance: result.distance,
        body: result.body,
      };
    }

    return {
      hit: false,
      point: new THREE.Vector3(
        origin.x + direction.x * maxDistance,
        origin.y + direction.y * maxDistance,
        origin.z + direction.z * maxDistance
      ),
      normal: new THREE.Vector3(0, 1, 0),
      distance: maxDistance,
      body: null,
    };
  }

  /**
   * 从屏幕中心发射射线（第一人称射击标准方式）
   * @param camera 相机
   * @param maxDistance 最大射程
   * @returns 命中结果
   */
  shootFromCamera(camera: THREE.Camera, maxDistance: number = 100): RaycastHit {
    // 从相机位置沿相机朝向发射
    const origin = camera.position.clone();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    direction.normalize();

    return this.shootRay(origin, direction, maxDistance);
  }

  /**
   * 使用 Three.js 射线检测（用于场景物体命中）
   * @param origin 射线起点
   * @param direction 射线方向
   * @param objects 要检测的对象列表
   * @param maxDistance 最大距离
   * @returns 命中结果数组
   */
  intersectObjects(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    objects: THREE.Object3D[],
    maxDistance: number = 100
  ): THREE.Intersection[] {
    this.threeRaycaster.set(origin, direction);
    this.threeRaycaster.far = maxDistance;
    return this.threeRaycaster.intersectObjects(objects, true);
  }
}
