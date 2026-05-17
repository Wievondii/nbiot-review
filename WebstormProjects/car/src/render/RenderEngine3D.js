/**
 * @file 3D 渲染引擎
 *
 * 基于 Three.js 的 WebGL 渲染引擎。
 * 实现 RenderEngine3D 接口：
 *   init(container: HTMLElement) - 在容器中创建 WebGL 渲染器
 *   render(scene: THREE.Scene, camera: THREE.Camera) - 渲染一帧
 *   resize(width: number, height: number) - 响应窗口尺寸变化
 *   dispose() - 释放 GPU 资源
 *
 * @module render/RenderEngine3D
 */

import * as THREE from 'three';

export class RenderEngine3D {
  constructor() {
    /** @type {THREE.WebGLRenderer|null} */
    this.renderer = null;

    /** @type {HTMLElement|null} */
    this.container = null;

    /** @type {THREE.Scene|null} 场景引用（由 SceneBuilder 设置） */
    this.scene = null;

    /** @type {THREE.Camera|null} 摄像机引用（由 SceneBuilder 或外部设置） */
    this.camera = null;

    /** @type {boolean} */
    this._initialized = false;
  }

  /**
   * 获取当前摄像机
   * @returns {THREE.Camera|null}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * 设置摄像机引用（由 SceneBuilder 或 CameraController 调用）
   * @param {THREE.Camera} cam
   */
  setCamera(cam) {
    this.camera = cam;
  }

  /**
   * 获取当前场景
   * @returns {THREE.Scene|null}
   */
  getScene() {
    return this.scene;
  }

  /**
   * 设置场景引用（由 SceneBuilder 调用）
   * @param {THREE.Scene} s
   */
  setScene(s) {
    this.scene = s;
  }

  /**
   * 初始化 3D 渲染引擎
   * 在指定容器内创建 WebGL 渲染器，配置阴影、色调映射、抗锯齿等
   *
   * @param {HTMLElement} container - 承载渲染画面的 DOM 容器
   */
  init(container) {
    if (this._initialized) {
      if (window.DEBUG) console.warn('[RenderEngine3D] 重复初始化');
      return;
    }

    this.container = container;

    // --- 创建 WebGL 渲染器 ---
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,       // 抗锯齿
      alpha: false,          // 不透明背景
      powerPreference: 'high-performance',
      stencil: false,        // 不需要模板缓冲
      depth: true,           // 需要深度缓冲
    });

    // 像素比（Retina 支持）
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 尺寸
    const width = container.clientWidth;
    const height = container.clientHeight;
    this.renderer.setSize(width, height);

    // 阴影
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔和阴影

    // 色调映射（HDR → LDR 转换，模拟胶片感）
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // 色彩空间
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 设置 CSS 样式使 canvas 填满容器
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';

    // 将 canvas 放入容器
    container.appendChild(this.renderer.domElement);

    this._initialized = true;

    if (window.DEBUG) console.log('[RenderEngine3D] 初始化完成');
  }

  /**
   * 渲染一帧
   * @param {THREE.Scene} scene - Three.js 场景
   * @param {THREE.Camera} camera - Three.js 摄像机
   */
  render(scene, camera) {
    if (!this._initialized || !this.renderer) return;
    this.renderer.render(scene, camera);
  }

  /**
   * 响应容器尺寸变化
   * @param {number} width - 新宽度（像素）
   * @param {number} height - 新高度（像素）
   */
  resize(width, height) {
    if (!this._initialized || !this.renderer) return;
    this.renderer.setSize(width, height);
  }

  /**
   * 释放渲染器占用的 GPU 资源和 DOM 元素
   * 调用后不能再使用此实例
   */
  dispose() {
    if (!this._initialized || !this.renderer) {
      this._initialized = false;
      return;
    }

    // 从 DOM 移除 canvas
    const canvas = this.renderer.domElement;
    if (canvas.parentElement) {
      canvas.parentElement.removeChild(canvas);
    }

    // 释放 GPU 资源
    this.renderer.dispose();
    this.renderer = null;
    this.container = null;
    this._initialized = false;

    if (window.DEBUG) console.log('[RenderEngine3D] 资源已释放');
  }
}
