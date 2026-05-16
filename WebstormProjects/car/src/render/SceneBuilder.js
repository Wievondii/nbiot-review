/**
 * @file 场景构建器
 *
 * 负责创建和初始化 Three.js 场景（Scene），
 * 包括天空盒、地形地面、环境雾等静态元素。
 *
 * @module render/SceneBuilder
 */

import * as THREE from 'three';

/**
 * 默认天空颜色（地平线附近）
 * @type {number}
 */
const SKY_COLOR = 0x87CEEB;

/**
 * 默认雾颜色（匹配天空）
 * @type {number}
 */
const FOG_COLOR = 0x87CEEB;

/**
 * 地面颜色（深色沥青）
 * @type {number}
 */
const GROUND_COLOR = 0x2a2a2a;

/**
 * 地面尺寸（米）
 * @type {number}
 */
const GROUND_SIZE = 1000;

/**
 * 地面重复纹理的数量
 * @type {number}
 */
const GROUND_REPEAT = 200;

export class SceneBuilder {
  constructor() {
    /** @type {THREE.Scene|null} */
    this.scene = null;

    /** @type {THREE.Mesh|null} */
    this.ground = null;

    /** @type {THREE.Mesh|null} */
    this.skyDome = null;
  }

  /**
   * 创建完整场景
   * 包括场景容器、天空盒、雾、地面
   *
   * @returns {THREE.Scene} 初始化完成的场景
   */
  createScene() {
    this.scene = new THREE.Scene();

    // 场景背景色（天空颜色，雾消失处的颜色）
    this.scene.background = new THREE.Color(SKY_COLOR);

    // 指数雾：近处清晰，远处渐隐至背景色
    // 参数：密度（越小雾越淡），200 米处开始可见，500 米处完全遮挡
    this.scene.fog = new THREE.Fog(SKY_COLOR, 200, 500);

    // 构建环境元素
    this._createGround();
    this._createSkyDome();

    return this.scene;
  }

  /**
   * 创建地面（大型平面网格，带重复纹理）
   * @private
   */
  _createGround() {
    if (!this.scene) return;

    // --- 地面纹理（程序化生成网格图案） ---
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 底色
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 256, 256);

    // 网格线 - 马路风格的浅色线条
    ctx.strokeStyle = 'rgba(60, 60, 80, 0.3)';
    ctx.lineWidth = 1;

    // 横向网格线
    for (let y = 0; y < 256; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    // 纵向网格线
    for (let x = 0; x < 256; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(GROUND_REPEAT, GROUND_REPEAT);
    texture.anisotropy = 4; // 提高倾斜视角清晰度

    // --- 地面几何体 ---
    const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: GROUND_COLOR,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    this.ground = new THREE.Mesh(geometry, material);
    // 地面绕 X 轴旋转 -90 度使其平躺（Y 轴朝上）
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -0.1; // 略低于赛道
    this.ground.receiveShadow = true;

    this.ground.name = 'ground';
    this.scene.add(this.ground);
  }

  /**
   * 创建天空穹顶
   * 使用大型球体内表面，带渐变颜色实现天空效果
   * @private
   */
  _createSkyDome() {
    if (!this.scene) return;

    // 使用 Canvas 生成渐变色纹理
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 垂直渐变：顶部深蓝 → 中间天蓝 → 底部浅蓝（地平线）
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0.0, '#1a1a4e');   // 顶部深蓝
    gradient.addColorStop(0.3, '#3a6ea5');   // 中上蓝
    gradient.addColorStop(0.6, '#87CEEB');   // 天蓝
    gradient.addColorStop(0.8, '#b0d4f1');   // 浅蓝
    gradient.addColorStop(1.0, '#d4e6f7');   // 地平线附近

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;

    // --- 天空球几何体 ---
    const geometry = new THREE.SphereGeometry(450, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide, // 从内部看
    });

    this.skyDome = new THREE.Mesh(geometry, material);
    this.skyDome.position.y = 0;
    this.skyDome.name = 'skyDome';
    this.scene.add(this.skyDome);
  }

  /**
   * 构建完整的 3D 场景和默认摄像机
   * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }}
   */
  build() {
    const scene = this.createScene();
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    return { scene, camera };
  }

  /**
   * 清理场景中所有对象（释放几何体、材质、纹理）
   */
  dispose() {
    if (!this.scene) return;

    this.scene.traverse((child) => {
      if (child.isMesh) {
        if (child.geometry) child.geometry.dispose();

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => { this._disposeMaterial(mat); });
          } else {
            this._disposeMaterial(child.material);
          }
        }
      }
    });

    this.scene = null;
    this.ground = null;
    this.skyDome = null;
  }

  /**
   * 释放材质及其关联的纹理
   * @private
   * @param {THREE.Material} material
   */
  _disposeMaterial(material) {
    // 释放纹理
    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    }
    material.dispose();
  }
}
