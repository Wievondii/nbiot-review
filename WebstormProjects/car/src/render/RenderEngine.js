/**
 * @file 渲染引擎
 *
 * 实现 RenderEngine 接口（init / render / setCamera）。
 * 使用 Canvas 2D API 渲染赛车、赛道和游戏状态。
 *
 * 优化策略：
 * - 静态元素（赛道背景）预渲染到 offscreen canvas
 * - 动态元素（赛车、特效）每帧重绘
 *
 * 坐标系：世界坐标（Y 轴向上）× 屏幕坐标（Y 轴向下），通过 Camera 转换
 */

import { Camera } from './Camera.js';
import { drawCar, drawBarriers, drawCheckpoints, drawStartPoint } from './Sprites.js';

export class RenderEngine {
  constructor() {
    /** @type {HTMLCanvasElement|null} */
    this.canvas = null;

    /** @type {CanvasRenderingContext2D|null} */
    this.ctx = null;

    /** @type {Camera} */
    this.camera = new Camera();

    /** @type {HTMLCanvasElement|null} 离屏 Canvas（缓存单个网格单元 pattern） */
    this._bgCanvas = null;

    /** @type {number} 设备像素比 */
    this._dpr = 1;
  }

  /**
   * 初始化渲染引擎
   * @param {HTMLCanvasElement} canvas
   */
  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._dpr = window.devicePixelRatio || 1;

    // 设置画布尺寸（匹配 CSS 尺寸，考虑 DPR）
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  /**
   * 调整画布尺寸
   * @private
   */
  _resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this._dpr;
    this.canvas.height = rect.height * this._dpr;
    this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    // 离屏 Canvas 不依赖画布尺寸，无需标记重绘
  }

  /**
   * 渲染一帧
   * @param {import('../types.js').CarEntity[]} cars - 赛车列表
   * @param {import('../types.js').TrackData|null} track - 赛道数据
   * @param {string} gameState - 当前游戏状态
   */
  render(cars, track, gameState) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const width = this.canvas.width / this._dpr;
    const height = this.canvas.height / this._dpr;

    // 更新摄像机跟随第一辆赛车
    if (cars && cars.length > 0) {
      this.camera.follow(cars[0].position, width, height);
    }

    // ================================================================
    // 背景层（预渲染离屏 Canvas → 快速 blit）
    // 赛道网格 + 深色底色是静态的，只需在变更时重绘一次
    // ================================================================
    this._renderBackground(ctx, track, width, height);

    // ================================================================
    // 游戏对象层
    // ================================================================
    this.camera.apply(ctx, width, height);

    // 绘制赛道边界
    if (track) {
      drawBarriers(ctx, track.barriers);
      drawCheckpoints(ctx, track.checkpoints);
      drawStartPoint(ctx, track.startPoint, track.startAngle);
    }

    // 绘制所有赛车（每帧根据摄像机位置渲染）
    if (cars) {
      for (const car of cars) {
        drawCar(ctx, car);
      }
    }

    this.camera.restore(ctx);

    // ================================================================
    // 前景层（雾效、遮罩等）- 预留
    // ================================================================
  }

  /**
   * 设置摄像机位置和角度
   * @param {import('../types.js').Vector2D} position
   * @param {number} angle
   */
  setCamera(position, angle) {
    if (position) {
      this.camera.targetX = position.x;
      this.camera.targetY = position.y;
      this.camera.x = position.x;
      this.camera.y = position.y;
    }
  }

  /**
   * 渲染静态背景（赛道地面网格）
   * 使用离屏 Canvas 预渲染一个网格单元作为 pattern，
   * 然后通过带偏移的 fillRect 实现摄像机跟随滚动效果。
   * 避免每帧重复绘制大量网格线。
   * @private
   */
  _renderBackground(ctx, track, width, height) {
    // 深色底色
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    // 计算摄像机偏移对应的像素偏移
    const gridWorldSize = 5; // 网格间距（米）
    const gridPixelSize = gridWorldSize * this.camera.zoom;
    if (gridPixelSize < 2) return; // 缩太小时跳过网格

    // 摄像机位置对应的世界坐标取模，得到像素偏移
    const offsetX =
      (-this.camera.x * this.camera.zoom) % gridPixelSize;
    const offsetY =
      (this.camera.y * this.camera.zoom) % gridPixelSize;

    // 预渲染单个网格单元到离屏 Canvas（长宽 = gridPixelSize）
    const cellPx = Math.ceil(gridPixelSize);
    if (
      !this._bgCanvas ||
      this._bgCanvas.width !== cellPx ||
      this._bgCanvas.height !== cellPx
    ) {
      this._bgCanvas = document.createElement('canvas');
      this._bgCanvas.width = cellPx;
      this._bgCanvas.height = cellPx;
      const bgCtx = this._bgCanvas.getContext('2d');
      bgCtx.strokeStyle = 'rgba(50, 50, 80, 0.3)';
      bgCtx.lineWidth = 0.5;
      // 右侧竖线
      bgCtx.beginPath();
      bgCtx.moveTo(cellPx - 0.5, 0);
      bgCtx.lineTo(cellPx - 0.5, cellPx);
      bgCtx.stroke();
      // 底部横线
      bgCtx.beginPath();
      bgCtx.moveTo(0, cellPx - 0.5);
      bgCtx.lineTo(cellPx, cellPx - 0.5);
      bgCtx.stroke();
    }

    // 通过 pattern 平铺整个画布，带偏移
    const pattern = ctx.createPattern(this._bgCanvas, 'repeat');
    if (pattern) {
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.fillStyle = pattern;
      ctx.fillRect(-cellPx, -cellPx, width + cellPx * 2, height + cellPx * 2);
      ctx.restore();
    }
  }
}
