/**
 * 渲染器封装
 * 封装 Three.js WebGLRenderer，提供统一的渲染接口
 */
import * as THREE from 'three';
import { IRenderer } from '../types/engine';

export class Renderer implements IRenderer {
  private renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  /** 渲染场景 */
  render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  /** 设置渲染尺寸 */
  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  /** 获取底层渲染器 */
  getWebGLRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /** 释放资源 */
  dispose(): void {
    this.renderer.dispose();
  }
}
