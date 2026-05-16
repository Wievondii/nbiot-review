/**
 * Menu - 赛车游戏开始菜单
 * 包含游戏标题、开始按钮、赛道选择、操作说明
 * 使用 DOM 元素覆盖在 Canvas 上方
 *
 * @module Menu
 */

// ============================================================
// 样式常量
// ============================================================

const COLORS = {
  cyan: '#00f0ff',
  magenta: '#ff00e4',
  yellow: '#ffd700',
  green: '#00ff88',
  darkBg: 'rgba(8, 8, 20, 0.95)',
};

// ============================================================
// Menu 类
// ============================================================

export class Menu {
  /**
   * @param {HTMLElement} container - 父容器
   */
  constructor(container) {
    /** @type {HTMLElement} */
    this.container = container;

    /** @type {HTMLElement|null} */
    this.element = null;

    /** @type {boolean} */
    this._mounted = false;

    /**
     * @private 赛道列表
     * 注意：track.id 必须与 TrackLoader 注册的赛道标识符一致
     * 当前只有 'motor-speedway' 一个赛道可用（见 TrackData.js）
     */
    this._tracks = [
      { id: 'motor-speedway', name: 'Motor Speedway', difficulty: 'Medium' },
    ];

    /** @private 当前选中的赛道索引 */
    this._selectedTrackIndex = 0;

    /** @private 回调 */
    this._callbacks = {
      onStart: null,
      onTrackSelect: null,
    };
  }

  // ==========================================================
  // 生命周期
  // ==========================================================

  /**
   * 显示菜单
   * @param {object} options
   * @param {Function} options.onStart       - 点击开始按钮回调
   * @param {Function} options.onTrackSelect - 选择赛道回调 (trackId) => void
   */
  show(options = {}) {
    this._callbacks.onStart = options.onStart || null;
    this._callbacks.onTrackSelect = options.onTrackSelect || null;

    if (this._mounted) return;
    this._build();
    this._mounted = true;
  }

  /**
   * 隐藏并移除菜单
   */
  hide() {
    if (!this._mounted || !this.element) return;
    this.element.remove();
    this.element = null;
    this._mounted = false;
  }

  // ==========================================================
  // DOM 构建
  // ==========================================================

  /**
   * 构建菜单 DOM 树
   * @private
   */
  _build() {
    const el = document.createElement('div');
    el.id = 'racing-menu';
    el.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: ${COLORS.darkBg};
      z-index: 100;
      font-family: 'Courier New', 'Consolas', monospace;
      color: #ffffff;
      overflow: hidden;
    `;

    // ------ 背景动效（纯 CSS 模拟霓虹光晕）------
    const bgGlow = document.createElement('div');
    bgGlow.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 600px;
      height: 600px;
      transform: translate(-50%, -50%);
      background: radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%);
      pointer-events: none;
    `;
    el.appendChild(bgGlow);

    // ------ 标题 ------
    const title = this._createTitle();
    el.appendChild(title);

    // ------ 赛道选择 ------
    const trackSection = this._createTrackSection();
    el.appendChild(trackSection);

    // ------ 开始按钮 ------
    const startBtn = this._createStartButton();
    el.appendChild(startBtn);

    // ------ 操作说明 ------
    const controls = this._createControls();
    el.appendChild(controls);

    this.container.appendChild(el);
    this.element = el;
  }

  /**
   * 创建游戏标题
   * @returns {HTMLElement}
   * @private
   */
  _createTitle() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align: center; margin-bottom: 40px;';

    const title = document.createElement('h1');
    title.textContent = 'NEON DRIFT';
    title.style.cssText = `
      font-size: clamp(48px, 8vw, 96px);
      font-weight: 900;
      letter-spacing: 12px;
      margin: 0;
      color: #ffffff;
      text-shadow:
        0 0 20px ${COLORS.cyan},
        0 0 40px ${COLORS.cyan}88,
        0 0 80px ${COLORS.cyan}44;
      animation: menuTitlePulse 2s ease-in-out infinite;
    `;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'ULTIMATE RACING EXPERIENCE';
    subtitle.style.cssText = `
      font-size: clamp(10px, 1.2vw, 14px);
      letter-spacing: 6px;
      margin: 10px 0 0 0;
      color: ${COLORS.magenta};
      text-shadow: 0 0 10px ${COLORS.magenta}66;
    `;

    wrapper.appendChild(title);
    wrapper.appendChild(subtitle);

    // 注入标题脉冲动画
    this._injectKeyframes('menuTitlePulse', `
      0%, 100% { opacity: 1; }
      50% { opacity: 0.85; }
    `);

    return wrapper;
  }

  /**
   * 创建赛道选择区域
   * @returns {HTMLElement}
   * @private
   */
  _createTrackSection() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      margin-bottom: 30px;
      text-align: center;
    `;

    const label = document.createElement('div');
    label.textContent = 'SELECT TRACK';
    label.style.cssText = `
      font-size: 12px;
      letter-spacing: 4px;
      color: ${COLORS.yellow};
      margin-bottom: 12px;
    `;

    const trackRow = document.createElement('div');
    trackRow.style.cssText = 'display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;';

    this._tracks.forEach((track, index) => {
      const btn = document.createElement('button');
      btn.dataset.index = String(index);
      btn.style.cssText = this._trackButtonStyle(index === this._selectedTrackIndex);

      // 名称行
      const nameSpan = document.createElement('div');
      nameSpan.textContent = track.name;
      nameSpan.style.cssText = 'font-size: 14px; font-weight: bold;';

      // 难度行
      const diffSpan = document.createElement('div');
      diffSpan.textContent = track.difficulty;
      diffSpan.style.cssText = `
        font-size: 10px;
        letter-spacing: 2px;
        color: ${this._difficultyColor(track.difficulty)};
        margin-top: 4px;
      `;

      btn.appendChild(nameSpan);
      btn.appendChild(diffSpan);

      btn.addEventListener('click', () => {
        this._selectTrack(index);
      });

      trackRow.appendChild(btn);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(trackRow);
    return wrapper;
  }

  /**
   * 创建开始按钮
   * @returns {HTMLElement}
   * @private
   */
  _createStartButton() {
    const btn = document.createElement('button');
    btn.textContent = '▶  START RACE';
    btn.style.cssText = `
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: clamp(18px, 2vw, 24px);
      font-weight: bold;
      letter-spacing: 4px;
      padding: 16px 48px;
      margin-bottom: 40px;
      border: 2px solid ${COLORS.green};
      border-radius: 4px;
      background: transparent;
      color: ${COLORS.green};
      cursor: pointer;
      transition: all 0.3s ease;
      text-shadow: 0 0 10px ${COLORS.green}44;
      box-shadow: 0 0 20px transparent;
    `;

    // hover 效果
    btn.addEventListener('mouseenter', () => {
      btn.style.background = `${COLORS.green}22`;
      btn.style.boxShadow = `0 0 30px ${COLORS.green}44, inset 0 0 30px ${COLORS.green}11`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.boxShadow = '0 0 20px transparent';
    });

    btn.addEventListener('click', () => {
      // 点击时的闪动效果
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => { btn.style.transform = 'scale(1)'; }, 100);

      if (this._callbacks.onStart) {
        this._callbacks.onStart();
      }
      // 通知赛道选择回调
      const selectedTrack = this._tracks[this._selectedTrackIndex];
      if (this._callbacks.onTrackSelect) {
        this._callbacks.onTrackSelect(selectedTrack.id);
      }
    });

    return btn;
  }

  /**
   * 创建操作说明
   * @returns {HTMLElement}
   * @private
   */
  _createControls() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.08);
      padding-top: 20px;
      width: 80%;
      max-width: 500px;
    `;

    const label = document.createElement('div');
    label.textContent = 'CONTROLS';
    label.style.cssText = `
      font-size: 11px;
      letter-spacing: 4px;
      color: ${COLORS.cyan};
      margin-bottom: 12px;
    `;

    const controls = [
      { key: '↑ / W', action: 'Throttle' },
      { key: '↓ / S', action: 'Brake' },
      { key: '← / A', action: 'Steer Left' },
      { key: '→ / D', action: 'Steer Right' },
      { key: 'SPACE', action: 'Drift' },
      { key: 'ESC', action: 'Pause' },
    ];

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: auto auto;
      gap: 6px 24px;
      justify-content: center;
      font-size: 13px;
    `;

    controls.forEach((c) => {
      const keyEl = document.createElement('span');
      keyEl.textContent = c.key;
      keyEl.style.cssText = `
        color: ${COLORS.yellow};
        text-align: right;
        font-weight: bold;
      `;

      const actionEl = document.createElement('span');
      actionEl.textContent = c.action;
      actionEl.style.cssText = 'color: #aaa; text-align: left;';

      grid.appendChild(keyEl);
      grid.appendChild(actionEl);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(grid);
    return wrapper;
  }

  // ==========================================================
  // 内部逻辑
  // ==========================================================

  /**
   * 选中某个赛道
   * @param {number} index
   * @private
   */
  _selectTrack(index) {
    if (index === this._selectedTrackIndex) return;
    this._selectedTrackIndex = index;

    // 刷新赛道按钮样式
    if (!this.element) return;
    const buttons = this.element.querySelectorAll('[data-index]');
    buttons.forEach((btn) => {
      const idx = parseInt(btn.dataset.index, 10);
      btn.style.cssText = this._trackButtonStyle(idx === this._selectedTrackIndex);
    });
  }

  // ==========================================================
  // 样式辅助
  // ==========================================================

  /**
   * 赛道按钮样式
   * @param {boolean} selected
   * @returns {string}
   * @private
   */
  _trackButtonStyle(selected) {
    const borderColor = selected ? COLORS.cyan : 'rgba(255,255,255,0.15)';
    const bgColor = selected ? 'rgba(0,240,255,0.1)' : 'transparent';
    const shadow = selected ? `0 0 15px ${COLORS.cyan}33` : 'none';
    return `
      font-family: 'Courier New', 'Consolas', monospace;
      padding: 10px 20px;
      border: 1px solid ${borderColor};
      border-radius: 4px;
      background: ${bgColor};
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: ${shadow};
      min-width: 140px;
    `;
  }

  /**
   * 难度对应的颜色
   * @param {string} difficulty
   * @returns {string}
   * @private
   */
  _difficultyColor(difficulty) {
    switch (difficulty) {
      case 'Easy': return COLORS.green;
      case 'Medium': return COLORS.yellow;
      case 'Hard': return COLORS.red;
      default: return '#888';
    }
  }

  /**
   * 向文档注入 @keyframes
   * @param {string} name
   * @param {string} css
   * @private
   */
  _injectKeyframes(name, css) {
    if (document.getElementById(`anim-${name}`)) return;
    const style = document.createElement('style');
    style.id = `anim-${name}`;
    style.textContent = `@keyframes ${name} { ${css} }`;
    document.head.appendChild(style);
  }
}
