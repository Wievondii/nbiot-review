/**
 * 基础关卡/场景
 * 创建地面、墙壁、障碍物等游戏场景元素
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { SceneManager } from '../engine/SceneManager';
import { PhysicsWorld } from '../engine/PhysicsWorld';

/** 场景物体配置 */
interface SceneObjectConfig {
  /** 是否投射阴影 */
  castShadow?: boolean;
  /** 是否接收阴影 */
  receiveShadow?: boolean;
}

const DEFAULT_OBJ_CONFIG: SceneObjectConfig = {
  castShadow: true,
  receiveShadow: true,
};

export class Level1 {
  private sceneManager: SceneManager;
  private physicsWorld: PhysicsWorld;
  private objects: THREE.Object3D[] = [];

  constructor(sceneManager: SceneManager, physicsWorld: PhysicsWorld) {
    this.sceneManager = sceneManager;
    this.physicsWorld = physicsWorld;
  }

  /** 构建关卡 */
  build(): void {
    this.createGround();
    this.createWalls();
    this.createObstacles();
    this.createDecorations();
  }

  /** 创建地面 */
  private createGround(): void {
    // 地面几何体
    const groundSize = 100;
    const geometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const material = new THREE.MeshPhongMaterial({
      color: 0x333333,
      specular: 0x111111,
      shininess: 10,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.sceneManager.add(ground);
    this.objects.push(ground);

    // 地面物理体
    const groundBody = new CANNON.Body({
      mass: 0, // 静态物体
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.physicsWorld.addBody(groundBody);

    // 添加地面网格线（视觉辅助）
    const gridHelper = new THREE.GridHelper(groundSize, 50, 0x222222, 0x1a1a1a);
    gridHelper.position.y = 0.01;
    this.sceneManager.add(gridHelper);
  }

  /** 创建围墙 */
  private createWalls(): void {
    const wallHeight = 4;
    const wallThickness = 0.5;
    const arenaSize = 45;

    // 四面墙
    const wallConfigs = [
      { pos: [0, wallHeight / 2, -arenaSize], rot: [0, 0, 0], size: [arenaSize * 2, wallHeight, wallThickness] },
      { pos: [0, wallHeight / 2, arenaSize], rot: [0, 0, 0], size: [arenaSize * 2, wallHeight, wallThickness] },
      { pos: [-arenaSize, wallHeight / 2, 0], rot: [0, 0, 0], size: [wallThickness, wallHeight, arenaSize * 2] },
      { pos: [arenaSize, wallHeight / 2, 0], rot: [0, 0, 0], size: [wallThickness, wallHeight, arenaSize * 2] },
    ];

    wallConfigs.forEach((config) => {
      this.createBox(
        new THREE.Vector3(config.pos[0], config.pos[1], config.pos[2]),
        new THREE.Vector3(config.size[0], config.size[1], config.size[2]),
        0x444444,
        { castShadow: false, receiveShadow: true }
      );
    });
  }

  /** 创建障碍物（掩体） */
  private createObstacles(): void {
    // 中央掩体
    this.createBox(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(3, 2, 3),
      0x5a3a1a
    );

    // 分散的掩体
    const obstaclePositions = [
      { pos: new THREE.Vector3(10, 0.75, 10), size: new THREE.Vector3(2, 1.5, 4) },
      { pos: new THREE.Vector3(-10, 0.75, -10), size: new THREE.Vector3(4, 1.5, 2) },
      { pos: new THREE.Vector3(15, 1, -5), size: new THREE.Vector3(3, 2, 2) },
      { pos: new THREE.Vector3(-15, 1, 8), size: new THREE.Vector3(2, 2, 3) },
      { pos: new THREE.Vector3(5, 0.5, -15), size: new THREE.Vector3(5, 1, 1) },
      { pos: new THREE.Vector3(-8, 1, 15), size: new THREE.Vector3(2, 2, 2) },
      { pos: new THREE.Vector3(20, 1.25, 0), size: new THREE.Vector3(2, 2.5, 6) },
      { pos: new THREE.Vector3(-20, 1, 0), size: new THREE.Vector3(6, 2, 2) },
    ];

    obstaclePositions.forEach((obs) => {
      this.createBox(obs.pos, obs.size, 0x6b4226);
    });

    // 立柱（提供垂直掩体）
    const pillarPositions = [
      new THREE.Vector3(7, 2, 7),
      new THREE.Vector3(-7, 2, -7),
      new THREE.Vector3(7, 2, -7),
      new THREE.Vector3(-7, 2, 7),
    ];

    pillarPositions.forEach((pos) => {
      this.createCylinder(pos, 0.4, 4, 0x555555);
    });
  }

  /** 创建装饰物 */
  private createDecorations(): void {
    // 几个废弃油桶
    const barrelPositions = [
      new THREE.Vector3(12, 0.5, -12),
      new THREE.Vector3(-5, 0.5, 18),
      new THREE.Vector3(25, 0.5, 15),
    ];

    barrelPositions.forEach((pos) => {
      this.createCylinder(pos, 0.3, 1, 0x8b4513);
    });

    // 地面血迹（红色平面）
    const bloodPositions = [
      new THREE.Vector3(3, 0.02, 5),
      new THREE.Vector3(-8, 0.02, -3),
      new THREE.Vector3(15, 0.02, -8),
    ];

    bloodPositions.forEach((pos) => {
      const geo = new THREE.CircleGeometry(0.8, 16);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x8b0000,
        transparent: true,
        opacity: 0.6,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(pos);
      this.sceneManager.add(mesh);
    });
  }

  /**
   * 创建盒子（可视化 + 物理）
   */
  private createBox(
    position: THREE.Vector3,
    size: THREE.Vector3,
    color: number,
    config: SceneObjectConfig = DEFAULT_OBJ_CONFIG
  ): THREE.Mesh {
    // 可视化
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshPhongMaterial({
      color,
      specular: 0x222222,
      shininess: 20,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = config.castShadow ?? true;
    mesh.receiveShadow = config.receiveShadow ?? true;
    this.sceneManager.add(mesh);
    this.objects.push(mesh);

    // 物理
    const body = new CANNON.Body({
      mass: 0, // 静态
      shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    this.physicsWorld.addBody(body);

    return mesh;
  }

  /**
   * 创建圆柱体
   */
  private createCylinder(
    position: THREE.Vector3,
    radius: number,
    height: number,
    color: number
  ): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 12);
    const material = new THREE.MeshPhongMaterial({
      color,
      specular: 0x222222,
      shininess: 20,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.sceneManager.add(mesh);
    this.objects.push(mesh);

    // 物理
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Cylinder(radius, radius, height, 12),
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    this.physicsWorld.addBody(body);

    return mesh;
  }

  /** 获取所有场景物体（用于射线检测） */
  getObjects(): THREE.Object3D[] {
    return this.objects;
  }

  /** 释放资源 */
  dispose(): void {
    this.objects.forEach((obj) => {
      this.sceneManager.remove(obj);
    });
    this.objects = [];
  }
}
