/**
 * Menu3D - 3D 赛车游戏开始菜单
 *
 * DOM 覆盖层显示在 Three.js Canvas 上方，包含：
 * - 游戏标题 "NEON DRIFT"（脉冲霓虹效果）
 * - 副标题标语
 * - 赛道选择按钮
 * - 开始比赛按钮
 * - 键盘操作说明
 *
 * @module Menu3D
 */

// ============================================================
// 样式常量
// ============================================================

const COLORS = {
  cyan: '#00f0ff',
  magenta: '#ff00e4',
  yellow: '#ffd700',
  green: '#00ff88',
  red: '#ff3355',
  white: '#ffffff',
  dim: '#888888',
  darkBg: 'rgba(8, 8, 20, 0.95)',
};

/** 赛道预设列表 */
const TRACKS = [
  { id: 'motor-speedway-3d', name: 'Motor Speedway', difficulty: 'Medium', desc: 'High-speed oval with sharp chicanes' },
  { id: 'neon-city', name: 'Neon City', difficulty: 'Hard', desc: 'Night street circuit through downtown' },
  { id: 'coastal-run', name: 'Coastal Run', difficulty: 'Easy', desc: 'Scenic seaside winding roads' },
];

/** 操作说明列表 */
const CONTROLS = [
  { key: '↑ / W', action: 'Throttle' },
  { key: '↓ / S', action: 'Brake' },
  { key: '← / A', action: 'Steer Left' },
  { key: '→ / D', action: 'Steer Right' },
  { key: 'SPACE', action: 'Drift' },
  { key: 'ESC', action: 'Pause' },
];

// ============================================================
// Menu3D 类
// ============================================================

export class Menu3D {
  constructor() {
    /** @type {HTMLElement|null} 挂载容器 */
    this.container = null;

    /** @type {HTMLElement|null} 根 DOM 元素 */
    this.element = null;

    /** @type {boolean} 是否已初始化 */
    this._initialized = false;

    /** @type {boolean} 是否正在显示 */
    this._visible = false;

    /** @type {number} 当前选中的赛道索引 */
    this._selectedTrackIndex = 0;

    /** @type {Object} 回调 */
    this._callbacks = {
      onStart: null,
      onTrackSelect: null,
    };
  }

  // ==========================================================
  // 生命周期
  // ==========================================================

  /**
   * 初始化菜单：构建 DOM 树
   * @param {HTMLElement} container - 父容器
   */
  init(container) {
    if (this._initialized) return;
    this.container = container;
    this._build();
    this._initialized = true;
  }

  /**
   * 显示菜单
   * @param {Object} [options]
   * @param {Function} [options.onStart]       点击"开始"回调
   * @param {Function} [options.onTrackSelect] 选择赛道回调 (trackId) => void
   */
  show(options = {}) {
    this._callbacks.onStart = options.onStart || null;
    this._callbacks.onTrackSelect = options.onTrackSelect || null;

    if (this._visible || !this.element) return;

    this._visible = true;
    this.element.style.display = '';
    void this.element.offsetHeight;
    this.element.style.opacity = '1';
  }

  /**
   * 隐藏菜单（淡出）
   */
  hide() {
    if (!this._visible || !this.element) return;

    this.element.style.opacity = '0';
    this._visible = false;

    // 过渡结束后隐藏
    setTimeout(() => {
      if (this.element && !this._visible) {
        this.element.style.display = 'none';
      }
    }, 400);
  }

  /**
   * 销毁菜单，清理 DOM
   */
  dispose() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.container = null;
    this._initialized = false;
    this._visible = false;
  }

  // ==========================================================
  // DOM 构建
  // ==========================================================

  /**
   * 构建完整的菜单 DOM 树
   * @private
   */
  _build() {
    const el = document.createElement('div');
    el.id = 'menu3d-root';
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
      color: ${COLORS.white};
      overflow: hidden;
      opacity: 0;
      transition: opacity 0.4s ease;
    `;

    // 背景光晕动效
    el.appendChild(this._buildBgGlow());

    // 标题区域
    el.appendChild(this._buildTitle());

    // 赛道选择
    el.appendChild(this._buildTrackSection());

    // 开始按钮
    el.appendChild(this._buildStartButton());

    // 操作说明
    el.appendChild(this._buildControls());

    this.container.appendChild(el);
    this.element = el;
  }

  /**
   * 背景霓虹光晕
   * @returns {HTMLElement}
   * @private
   */
  _buildBgGlow() {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 800px;
      height: 800px;
      transform: translate(-50%, -50%);
      background:
        radial-gradient(circle at 30% 40%, rgba(0,240,255,0.05) 0%, transparent 50%),
        radial-gradient(circle at 70% 60%, rgba(255,0,228,0.04) 0%, transparent 50%);
      pointer-events: none;
      animation: menu3dGlowPulse 4s ease-in-out infinite;
    `;
    this._injectKeyframes('menu3dGlowPulse', `
      0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
    `);
    return glow;
  }

  /**
   * 游戏标题 + 副标题
   * @returns {HTMLElement}
   * @private
   */
  _buildTitle() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align: center; margin-bottom: 36px; z-index: 1;';

    const title = document.createElement('h1');
    title.textContent = 'NEON DRIFT';
    title.style.cssText = `
      font-size: clamp(48px, 8vw, 96px);
      font-weight: 900;
      letter-spacing: 12px;
      margin: 0;
      color: ${COLORS.white};
      text-shadow:
        0 0 20px ${COLORS.cyan},
        0 0 40px ${COLORS.cyan}88,
        0 0 80px ${COLORS.cyan}44;
      animation: menu3dTitlePulse 2.5s ease-in-out infinite;
    `;
    this._injectKeyframes('menu3dTitlePulse', `
      0%, 100% { opacity: 1; text-shadow: 0 0 20px ${COLORS.cyan}, 0 0 40px ${COLORS.cyan}88, 0 0 80px ${COLORS.cyan}44; }
      50% { opacity: 0.8; text-shadow: 0 0 30px ${COLORS.cyan}, 0 0 60px ${COLORS.cyan}99, 0 0 100px ${COLORS.cyan}55; }
    `);

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
    return wrapper;
  }

  /**
   * 赛道选择区域
   * @returns {HTMLElement}
   * @private
   */
  _buildTrackSection() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      margin-bottom: 28px;
      text-align: center;
      z-index: 1;
    `;

    const label = document.createElement('div');
    label.textContent = '— SELECT TRACK —';
    label.style.cssText = `
      font-size: 12px;
      letter-spacing: 4px;
      color: ${COLORS.dim};
      margin-bottom: 14px;
    `;

    const trackRow = document.createElement('div');
    trackRow.style.cssText = 'display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;';

    TRACKS.forEach((track, index) => {
      const btn = document.createElement('button');
      btn.dataset.index = String(index);
      btn.style.cssText = this._trackButtonStyle(index === this._selectedTrackIndex);

      // 赛道名称
      const nameSpan = document.createElement('div');
      nameSpan.textContent = track.name;
      nameSpan.style.cssText = 'font-size: 14px; font-weight: bold;';

      // 难度标签
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
      btn.addEventListener('mouseenter', () => {
        btn.style.borderColor = COLORS.cyan;
        btn.style.boxShadow = `0 0 20px ${COLORS.cyan}44`;
      });
      btn.addEventListener('mouseleave', () => {
        const selected = index === this._selectedTrackIndex;
        btn.style.cssText = this._trackButtonStyle(selected);
      });

      trackRow.appendChild(btn);
    });

    wrapper.appendChild(label);
    wrapper.appendChild(trackRow);
    return wrapper;
  }

  /**
   * 开始按钮
   * @returns {HTMLElement}
   * @private
   */
  _buildStartButton() {
    const btn = document.createElement('button');
    btn.textContent = '▶  START RACE';
    btn.style.cssText = `
      font-family: 'Courier New', 'Consolas', monospace;
      font-size: clamp(18px, 2vw, 24px);
      font-weight: bold;
      letter-spacing: 4px;
      padding: 16px 56px;
      margin-bottom: 36px;
      border: 2px solid ${COLORS.green};
      border-radius: 4px;
      background: transparent;
      color: ${COLORS.green};
      cursor: pointer;
      transition: all 0.3s ease;
      text-shadow: 0 0 10px ${COLORS.green}44;
      box-shadow: 0 0 20px transparent;
      z-index: 1;
    `;

    btn.addEventListener('mouseenter', () => {
      btn.style.background = `${COLORS.green}22`;
      btn.style.boxShadow = `0 0 30px ${COLORS.green}44, inset 0 0 30px ${COLORS.green}11`;
      btn.style.transform = 'scale(1.03)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
      btn.style.boxShadow = '0 0 20px transparent';
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', () => {
      // 点击反馈动画
      btn.style.transform = 'scale(0.93)';
      setTimeout(() => { btn.style.transform = 'scale(1)'; }, 120);

      const selectedTrack = TRACKS[this._selectedTrackIndex];

      // 先触发赛道选择
      if (this._callbacks.onTrackSelect) {
        this._callbacks.onTrackSelect(selectedTrack.id);
      }

      // 延迟一点触发开始，让赛道选择先完成
      setTimeout(() => {
        if (this._callbacks.onStart) {
          this._callbacks.onStart();
        }
      }, 50);
    });

    return btn;
  }

  /**
   * 键盘操作说明
   * @returns {HTMLElement}
   * @private
   */
  _buildControls() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      text-align: center;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 18px;
      width: 80%;
      max-width: 500px;
      z-index: 1;
    `;

    const label = document.createElement('div');
    label.textContent = 'CONTROLS';
    label.style.cssText = `
      font-size: 11px;
      letter-spacing: 4px;
      color: ${COLORS.dim};
      margin-bottom: 12px;
    `;

    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: auto auto;
      gap: 5px 28px;
      justify-content: center;
      font-size: 13px;
    `;

    CONTROLS.forEach((c) => {
      const keyEl = document.createElement('span');
      keyEl.textContent = c.key;
      keyEl.style.cssText = `
        color: ${COLORS.yellow};
        text-align: right;
        font-weight: bold;
      `;

      const actionEl = document.createElement('span');
      actionEl.textContent = c.action;
      actionEl.style.cssText = `color: ${COLORS.dim}; text-align: left;`;

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

    // 刷新所有赛道按钮样式
    if (!this.element) return;
    const buttons = this.element.querySelectorAll('[data-index]');
    buttons.forEach((btn) => {
      const idx = parseInt(btn.dataset.index, 10);
      btn.style.cssText = this._trackButtonStyle(idx === this._selectedTrackIndex);
    });
  }

  /**
   * 获取当前选中的赛道 ID
   * @returns {string}
   */
  getSelectedTrackId() {
    return TRACKS[this._selectedTrackIndex].id;
  }

  // ==========================================================
  // 样式辅助
  // ==========================================================

  /**
   * 赛道按钮的内联样式
   * @param {boolean} selected - 是否选中
   * @returns {string}
   * @private
   */
  _trackButtonStyle(selected) {
    const borderColor = selected ? COLORS.cyan : 'rgba(255,255,255,0.12)';
    const bgColor = selected ? 'rgba(0,240,255,0.1)' : 'transparent';
    const shadow = selected ? `0 0 15px ${COLORS.cyan}44` : 'none';
    return `
      font-family: 'Courier New', 'Consolas', monospace;
      padding: 12px 22px;
      border: 1px solid ${borderColor};
      border-radius: 4px;
      background: ${bgColor};
      color: ${COLORS.white};
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: ${shadow};
      min-width: 150px;
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
      default: return COLORS.dim;
    }
  }

  /**
   * 向文档头部注入 @keyframes 动画
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
