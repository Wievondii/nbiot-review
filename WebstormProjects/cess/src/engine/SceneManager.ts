/**
 * 场景管理器
 * 管理 Three.js 场景、灯光、相机
 */
import * as THREE from 'three';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  /** 所有需要同步物理的网格 */
  private dynamicMeshes: Map<string, THREE.Object3D> = new Map();

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.scene.fog = new THREE.Fog(0x111111, 30, 80);

    // 第一人称相机
    this.camera = new THREE.PerspectiveCamera(
      75, // 视野角度
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 1.7, 0); // 人眼高度

    this.setupLights();
  }

  /** 设置场景灯光 */
  private setupLights(): void {
    // 环境光 - 暗黑风格用低强度
    const ambientLight = new THREE.AmbientLight(0x222222, 0.5);
    this.scene.add(ambientLight);

    // 主方向光（月光效果）
    const directionalLight = new THREE.DirectionalLight(0x4466aa, 0.3);
    directionalLight.position.set(-10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    this.scene.add(directionalLight);

    // 补充点光源（暖色调，模拟火把/灯光）
    const pointLight1 = new THREE.PointLight(0xff6600, 1.5, 30);
    pointLight1.position.set(10, 5, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff4400, 1.2, 25);
    pointLight2.position.set(-10, 5, -10);
    this.scene.add(pointLight2);
  }

  /** 添加对象到场景 */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /** 从场景移除对象 */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /** 注册动态网格（用于物理同步） */
  registerDynamic(id: string, mesh: THREE.Object3D): void {
    this.dynamicMeshes.set(id, mesh);
  }

  /** 注销动态网格 */
  unregisterDynamic(id: string): void {
    this.dynamicMeshes.delete(id);
  }

  /** 获取动态网格 */
  getDynamic(id: string): THREE.Object3D | undefined {
    return this.dynamicMeshes.get(id);
  }

  /** 处理窗口大小变化 */
  onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** 获取场景 */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /** 获取相机 */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /** 释放资源 */
  dispose(): void {
    // 清理场景中的所有对象
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => { m.dispose(); });
        } else {
          object.material.dispose();
        }
      }
    });
    this.dynamicMeshes.clear();
  }
}
