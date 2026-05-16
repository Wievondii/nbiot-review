/**
 * HUD - 赛车游戏抬头显示器
 * 使用 DOM 元素覆盖在 Canvas 上方，实时显示速度、圈数、计时、漂移状态
 *
 * @module HUD
 */

// ============================================================
// 样式常量
// ============================================================

/** HUD 根容器样式 */
const HUD_STYLE = {
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  fontFamily: "'Courier New', 'Consolas', monospace",
  color: '#ffffff',
  zIndex: '10',
  overflow: 'hidden',
};

/** 通用霓虹色定义 */
const COLORS = {
  cyan: '#00f0ff',
  magenta: '#ff00e4',
  yellow: '#ffd700',
  green: '#00ff88',
  red: '#ff3355',
  darkBg: 'rgba(0, 0, 0, 0.6)',
  darkBgLight: 'rgba(0, 0, 0, 0.3)',
};

// ============================================================
// HUD 类
// ============================================================

export class HUD {
  /**
   * @param {HTMLElement} container - 父容器（通常是 canvas 的父元素）
   */
  constructor(container) {
    /** @type {HTMLElement} */
    this.container = container;

    /** @type {HTMLElement|null} */
    this.element = null;

    /** 子元素引用 */
    this.speedBar = null;
    this.speedText = null;
    this.lapText = null;
    this.timerText = null;
    this.driftIndicator = null;

    /** @type {boolean} 是否已挂载 */
    this._mounted = false;
  }

  // ==========================================================
  // 初始化
  // ==========================================================

  /**
   * 创建并挂载 HUD DOM 元素
   */
  mount() {
    if (this._mounted) return;

    // 根容器
    const el = document.createElement('div');
    Object.assign(el.style, HUD_STYLE);
    el.id = 'racing-hud';

    // ------ 左下方：速度表 ------
    const speedPanel = this._createSpeedPanel();
    el.appendChild(speedPanel);

    // ------ 右上方：圈数与计时 ------
    const infoPanel = this._createInfoPanel();
    el.appendChild(infoPanel);

    // ------ 漂移指示器 ------
    const drift = this._createDriftIndicator();
    el.appendChild(drift);

    this.container.appendChild(el);
    this.element = el;
    this._mounted = true;
  }

  /**
   * 从 DOM 移除 HUD
   */
  unmount() {
    if (!this._mounted || !this.element) return;
    this.element.remove();
    this.element = null;
    this._mounted = false;
  }

  // ==========================================================
  // 子组件构建
  // ==========================================================

  /**
   * 创建速度表面板（左下角）
   * @returns {HTMLElement}
   * @private
   */
  _createSpeedPanel() {
    const panel = document.createElement('div');
    panel.id = 'hud-speed-panel';
    panel.style.cssText = `
      position: absolute;
      bottom: 40px;
      left: 40px;
      min-width: 220px;
    `;

    // 速度数值标签
    const label = document.createElement('div');
    label.textContent = 'SPEED';
    label.style.cssText = `
      font-size: 12px;
      letter-spacing: 3px;
      color: ${COLORS.cyan};
      margin-bottom: 4px;
    `;

    // 速度数值（大号数字）
    const valueRow = document.createElement('div');
    valueRow.style.cssText = 'display: flex; align-items: baseline; gap: 6px;';

    this.speedText = document.createElement('span');
    this.speedText.textContent = '000';
    this.speedText.style.cssText = `
      font-size: 48px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 0 0 20px ${COLORS.cyan}66;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    `;

    const unit = document.createElement('span');
    unit.textContent = 'km/h';
    unit.style.cssText = `
      font-size: 14px;
      color: #888;
      letter-spacing: 1px;
    `;

    valueRow.appendChild(this.speedText);
    valueRow.appendChild(unit);

    // 速度进度条
    const barOuter = document.createElement('div');
    barOuter.style.cssText = `
      width: 100%;
      height: 6px;
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
      margin-top: 8px;
      overflow: hidden;
    `;

    this.speedBar = document.createElement('div');
    this.speedBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.magenta});
      border-radius: 3px;
      transition: width 0.05s linear;
    `;
    barOuter.appendChild(this.speedBar);

    panel.appendChild(label);
    panel.appendChild(valueRow);
    panel.appendChild(barOuter);

    return panel;
  }

  /**
   * 创建信息面板（右上角：圈数、计时）
   * @returns {HTMLElement}
   * @private
   */
  _createInfoPanel() {
    const panel = document.createElement('div');
    panel.id = 'hud-info-panel';
    panel.style.cssText = `
      position: absolute;
      top: 30px;
      right: 40px;
      text-align: right;
      min-width: 180px;
    `;

    // 圈数
    const lapLabel = document.createElement('div');
    lapLabel.textContent = 'LAP';
    lapLabel.style.cssText = `
      font-size: 12px;
      letter-spacing: 3px;
      color: ${COLORS.yellow};
      margin-bottom: 2px;
    `;

    this.lapText = document.createElement('div');
    this.lapText.textContent = '1 / 3';
    this.lapText.style.cssText = `
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 0 0 15px ${COLORS.yellow}55;
      margin-bottom: 16px;
      font-variant-numeric: tabular-nums;
    `;

    // 计时器
    const timerLabel = document.createElement('div');
    timerLabel.textContent = 'TIME';
    timerLabel.style.cssText = `
      font-size: 12px;
      letter-spacing: 3px;
      color: ${COLORS.cyan};
      margin-bottom: 2px;
    `;

    this.timerText = document.createElement('div');
    this.timerText.textContent = '00:00.000';
    this.timerText.style.cssText = `
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 0 0 15px ${COLORS.cyan}55;
      font-variant-numeric: tabular-nums;
    `;

    panel.appendChild(lapLabel);
    panel.appendChild(this.lapText);
    panel.appendChild(timerLabel);
    panel.appendChild(this.timerText);

    return panel;
  }

  /**
   * 创建漂移指示器（屏幕中央偏下）
   * @returns {HTMLElement}
   * @private
   */
  _createDriftIndicator() {
    const container2 = document.createElement('div');
    container2.id = 'hud-drift';
    container2.style.cssText = `
      position: absolute;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.15s ease;
      text-align: center;
    `;

    this.driftText = document.createElement('div');
    this.driftText.textContent = '🔥 DRIFT!';
    this.driftText.style.cssText = `
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 6px;
      color: ${COLORS.magenta};
      text-shadow:
        0 0 20px ${COLORS.magenta},
        0 0 40px ${COLORS.magenta}99,
        0 0 80px ${COLORS.magenta}44;
      padding: 8px 24px;
      background: rgba(255,0,228,0.08);
      border: 2px solid ${COLORS.magenta}44;
      border-radius: 4px;
    `;

    container2.appendChild(this.driftText);
    return container2;
  }

  // ==========================================================
  // 数据更新（每帧调用）
  // ==========================================================

  /**
   * 更新 HUD 数据
   *
   * @param {object} data - HUD 数据
   * @param {number}  data.speed        - 当前速度（m/s）
   * @param {number}  data.lap          - 当前圈数
   * @param {number}  data.totalLaps    - 总圈数
   * @param {number}  data.elapsedTime  - 已用时间（秒）
   * @param {boolean} data.isDrifting   - 是否漂移中
   * @param {boolean} [data.isRacing]   - 是否比赛中（用于复位计时器）
   */
  update(data) {
    if (!this._mounted) return;

    // ---- 速度 ----
    const speedKmh = Math.round(Math.abs(data.speed) * 3.6);
    const displaySpeed = Math.min(speedKmh, 999);
    this.speedText.textContent = String(displaySpeed).padStart(3, '0');

    // 速度进度条（假设最高 300 km/h）
    const pct = Math.min((speedKmh / 300) * 100, 100);
    this.speedBar.style.width = `${pct}%`;

    // 速度过高时变色警告
    const speedColor = speedKmh > 200 ? COLORS.red : speedKmh > 120 ? COLORS.yellow : '#ffffff';
    this.speedText.style.color = speedColor;
    this.speedText.style.textShadow = `0 0 20px ${speedColor}66`;

    // ---- 圈数 ----
    const lap = data.lap ?? 1;
    const totalLaps = data.totalLaps ?? 3;
    this.lapText.textContent = `${lap} / ${totalLaps}`;

    // ---- 计时 ----
    if (data.elapsedTime != null) {
      this.timerText.textContent = this._formatTime(data.elapsedTime);
    }

    // ---- 漂移指示器 ----
    const driftEl = this.element.querySelector('#hud-drift');
    if (driftEl) {
      driftEl.style.opacity = data.isDrifting ? '1' : '0';
    }
  }

  // ==========================================================
  // 工具方法
  // ==========================================================

  /**
   * 将秒数格式化为 MM:SS.ms
   * @param {number} seconds
   * @returns {string}
   * @private
   */
  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const wholeSecs = Math.floor(secs);
    const ms = Math.floor((secs - wholeSecs) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(wholeSecs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }
}
