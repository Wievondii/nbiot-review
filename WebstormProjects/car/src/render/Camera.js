/**
 * @file 摄像机系统
 *
 * 负责将世界坐标转换为屏幕坐标。
 * 世界坐标系：Y轴向上为正，X轴向右为正。
 * 屏幕坐标系：Y轴向下为正，X轴向右为正。
 * 转换流程：世界坐标 → 平移至摄像机位置 → 翻转 Y 轴 → 缩放 → 居中到屏幕。
 */

export class Camera {
  constructor() {
    /** @type {number} 摄像机目标 X（世界坐标） */
    this.targetX = 0;
    /** @type {number} 摄像机目标 Y（世界坐标） */
    this.targetY = 0;
    /** @type {number} 当前 X（平滑过渡） */
    this.x = 0;
    /** @type {number} 当前 Y（平滑过渡） */
    this.y = 0;
    /** @type {number} 缩放比例（像素/米） */
    this.zoom = 4;
    /** @type {number} 插值因子（0~1，越大跟随越快） */
    this.lerpFactor = 0.08;
  }

  /**
   * 跟随目标位置（每帧调用）
   * @param {import('../types.js').Vector2D} target - 目标位置（世界坐标）
   * @param {number} [canvasWidth] - 画布宽度，用于边界约束
   * @param {number} [canvasHeight] - 画布高度，用于边界约束
   */
  follow(target, canvasWidth, canvasHeight) {
    this.targetX = target.x;
    this.targetY = target.y;

    // 线性插值平滑过渡
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;
  }

  /**
   * 应用摄像机变换到 Canvas 上下文。
   * 调用后所有绘制坐标使用世界坐标。
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   */
  apply(ctx, canvasWidth, canvasHeight) {
    ctx.save();
    // 1. 将原点移动到屏幕中心
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    // 2. 翻转 Y 轴（世界坐标 Y 向上 vs 屏幕 Y 向下）
    ctx.scale(this.zoom, -this.zoom);
    // 3. 平移至摄像机位置（使得摄像机位置在屏幕中心）
    ctx.translate(-this.x, -this.y);
  }

  /**
   * 恢复 Canvas 上下文变换
   * @param {CanvasRenderingContext2D} ctx
   */
  restore(ctx) {
    ctx.restore();
  }

  /**
   * 将世界坐标转换为屏幕坐标（用于 UI 元素定位）
   * @param {import('../types.js').Vector2D} worldPos
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @returns {{ x: number, y: number }}
   */
  worldToScreen(worldPos, canvasWidth, canvasHeight) {
    const dx = worldPos.x - this.x;
    const dy = worldPos.y - this.y;
    return {
      x: canvasWidth / 2 + dx * this.zoom,
      y: canvasHeight / 2 - dy * this.zoom,
    };
  }
}
