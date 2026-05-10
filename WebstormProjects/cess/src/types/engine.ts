/**
 * 核心引擎接口定义
 * 使用 three 和 cannon-es 的真实类型
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface IGameEngine {
  init(canvas: HTMLCanvasElement): Promise<void>;
  update(deltaTime: number): void;
  dispose(): void;
}

export interface IRenderer {
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  setSize(width: number, height: number): void;
}

export interface IPhysicsWorld {
  addBody(body: CANNON.Body): void;
  removeBody(body: CANNON.Body): void;
  step(deltaTime: number): void;
  raycast(from: CANNON.Vec3, to: CANNON.Vec3): CANNON.RaycastResult | null;
}
