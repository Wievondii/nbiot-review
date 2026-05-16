/**
 * Countdown - 赛车游戏倒计时系统
 * 3 → 2 → 1 → GO! 带放大/淡出动画效果
 *
 * @module Countdown
 */

// ============================================================
// 常量
// ============================================================

const STAGES = [
  { label: '3', color: '#ffd700', duration: 1000 },
  { label: '2', color: '#ffd700', duration: 1000 },
  { label: '1', color: '#ffd700', duration: 1000 },
  { label: 'GO!', color: '#00ff88', duration: 800 },
];

const COLORS = {
  cyan: '#00f0ff',
  magenta: '#ff00e4',
  yellow: '#ffd700',
  green: '#00ff88',
};

// ============================================================
// Countdown 类
// ============================================================

export class Countdown {
  /**
   * @param {HTMLElement} container - 父容器
   */
  constructor(container) {
    /** @type {HTMLElement} */
    this.container = container;

    /** @type {HTMLElement|null} */
    this.element = null;

    /** @type {number|null} 当前阶段的索引 */
    this._currentIndex = -1;

    /** @type {number|null} setTimeout id */
    this._timeoutId = null;

    /** @type {number|null} requestAnimationFrame id */
    this._rafId = null;

    /** @type {boolean} */
    this._running = false;

    /** @type {number} 开始时间戳 */
    this._startTime = 0;

    /** @type {Function|null} 完成回调 */
    this._onComplete = null;

    /** @type {HTMLElement|null} 数字显示元素 */
    this._displayEl = null;

    /** @type {HTMLElement|null} 背景光晕 */
    this._glowEl = null;
  }

  // ==========================================================
  // 生命周期
  // ==========================================================

  /**
   * 开始倒计时
   * @param {Function} [onComplete] 倒计时结束回调
   */
  start(onComplete) {
    if (this._running) return;

    this._onComplete = onComplete || null;
    this._currentIndex = -1;
    this._running = true;

    this._buildDOM();
    this._nextStage();

    // 注入动画关键帧
    this._injectKeyframes();
  }

  /**
   * 停止并清理倒计时
   */
  stop() {
    this._running = false;
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this._displayEl = null;
    this._glowEl = null;
    this._currentIndex = -1;
  }

  // ==========================================================
  // DOM 构建
  // ==========================================================

  /**
   * 构建倒计时 DOM
   * @private
   */
  _buildDOM() {
    if (this.element) return;

    const el = document.createElement('div');
    el.id = 'racing-countdown';
    el.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 50;
      pointer-events: none;
      font-family: 'Courier New', 'Consolas', monospace;
    `;

    // 背景光晕
    this._glowEl = document.createElement('div');
    this._glowEl.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 300px;
      height: 300px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: radial-gradient(circle, ${COLORS.yellow}22 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    `;
    el.appendChild(this._glowEl);

    // 数字显示
    this._displayEl = document.createElement('div');
    this._displayEl.textContent = '';
    this._displayEl.id = 'countdown-number';
    this._displayEl.style.cssText = `
      font-size: clamp(120px, 20vw, 240px);
      font-weight: 900;
      color: ${COLORS.yellow};
      text-shadow: 0 0 40px ${COLORS.yellow}66, 0 0 80px ${COLORS.yellow}33;
      z-index: 1;
      line-height: 1;
      user-select: none;
    `;
    el.appendChild(this._displayEl);

    this.container.appendChild(el);
    this.element = el;
  }

  // ==========================================================
  // 阶段推进
  // ==========================================================

  /**
   * 进入下一个阶段
   * @private
   */
  _nextStage() {
    if (!this._running) return;

    this._currentIndex++;

    // 所有阶段完成
    if (this._currentIndex >= STAGES.length) {
      this._finish();
      return;
    }

    const stage = STAGES[this._currentIndex];
    this._animateStage(stage);
  }

  /**
   * 为当前阶段播放动画
   * @param {{ label: string, color: string, duration: number }} stage
   * @private
   */
  _animateStage(stage) {
    if (!this._displayEl || !this._glowEl) return;

    const isGo = stage.label === 'GO!';

    // 设置文字
    this._displayEl.textContent = stage.label;
    this._displayEl.style.color = stage.color;
    this._displayEl.style.textShadow = `0 0 40px ${stage.color}66, 0 0 80px ${stage.color}33`;

    // 光晕颜色
    this._glowEl.style.background = `radial-gradient(circle, ${stage.color}22 0%, transparent 70%)`;
    this._glowEl.style.opacity = '1';

    // 重置动画
    this._displayEl.style.transition = 'none';
    this._displayEl.style.transform = 'scale(1.8)';
    this._displayEl.style.opacity = '0';

    // 强制回流后播放动画
    void this._displayEl.offsetHeight;

    this._displayEl.style.transition = `
      transform ${isGo ? 0.4 : 0.35}s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity ${isGo ? 0.4 : 0.35}s ease-out
    `;
    this._displayEl.style.transform = 'scale(1)';
    this._displayEl.style.opacity = '1';

    // GO! 额外闪烁动画
    if (isGo) {
      this._displayEl.style.animation = 'countdownGoPulse 0.4s ease-in-out 3';
    }

    // 阶段持续时间后进入下一阶段
    this._timeoutId = setTimeout(() => {
      // 淡出当前数字
      if (this._displayEl) {
        this._displayEl.style.transition = 'transform 0.15s ease-in, opacity 0.15s ease-in';
        this._displayEl.style.transform = 'scale(0.5)';
        this._displayEl.style.opacity = '0';
        if (this._glowEl) {
          this._glowEl.style.transition = 'opacity 0.15s ease-in';
          this._glowEl.style.opacity = '0';
        }
      }

      // 短暂延迟后进入下一阶段
      this._timeoutId = setTimeout(() => {
        this._nextStage();
      }, 180);
    }, stage.duration);
  }

  /**
   * 倒计时完成
   * @private
   */
  _finish() {
    this._running = false;

    // 清理 DOM
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this._displayEl = null;
    this._glowEl = null;

    // 触发回调
    if (this._onComplete) {
      this._onComplete();
    }
  }

  // ==========================================================
  // 动画关键帧
  // ==========================================================

  /**
   * 注入 CSS 动画
   * @private
   */
  _injectKeyframes() {
    if (document.getElementById('anim-countdown-go')) return;

    const style = document.createElement('style');
    style.id = 'anim-countdown-go';
    style.textContent = `
      @keyframes countdownGoPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
    `;
    document.head.appendChild(style);
  }
}
