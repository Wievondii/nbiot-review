/**
 * 触摸输入模块
 *
 * 提供移动端虚拟摇杆（左）和按钮（右）的触摸交互：
 * - 左侧水平摇杆 → 转向（-1 ~ 1）
 * - 右侧按钮   → 油门 / 刹车 / 漂移
 *
 * 自动检测触摸支持，在不支持的设备上静默跳过。
 * 使用 Pointer Events 实现，兼容触屏和鼠标调试。
 */

/* ── 内联样式字符串（初始化时注入，避免桌面端无谓开销） ── */

const TOUCH_STYLES = `
  .touch-input-overlay {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1000;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .touch-input-overlay.is-active {
    pointer-events: auto;
  }

  /* 摇杆容器 — 左下角 */
  .touch-joystick {
    position: absolute;
    left: 24px;
    bottom: 40px;
    width: 130px;
    height: 130px;
    pointer-events: auto;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    border: 2px solid rgba(255, 255, 255, 0.20);
    box-sizing: border-box;
  }

  /* 摇杆滑块 */
  .touch-joystick-thumb {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 56px;
    height: 56px;
    margin: -28px 0 0 -28px;
    border-radius: 50%;
    background: radial-gradient(circle at 40% 35%, rgba(255,255,255,0.5), rgba(255,255,255,0.15));
    border: 1px solid rgba(255, 255, 255, 0.35);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: none;
    box-sizing: border-box;
  }

  /* 按钮容器 — 右下角 */
  .touch-buttons {
    position: absolute;
    right: 20px;
    bottom: 30px;
    display: flex;
    gap: 14px;
    pointer-events: none;
    align-items: flex-end;
  }

  .touch-btn {
    pointer-events: auto;
    border: none;
    border-radius: 50%;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.08s, box-shadow 0.08s, background 0.08s;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }

  .touch-btn:active,
  .touch-btn.active {
    transform: scale(0.90);
  }

  .touch-btn-throttle {
    width: 72px;
    height: 72px;
    background: radial-gradient(circle at 40% 35%, #4ade80, #16a34a);
    box-shadow: 0 4px 16px rgba(22, 163, 74, 0.45);
    font-size: 14px;
  }
  .touch-btn-throttle.active {
    background: radial-gradient(circle at 40% 35%, #6ee7a0, #22c55e);
    box-shadow: 0 2px 24px rgba(22, 163, 74, 0.70);
  }

  .touch-btn-brake {
    width: 64px;
    height: 64px;
    background: radial-gradient(circle at 40% 35%, #f87171, #dc2626);
    box-shadow: 0 4px 16px rgba(220, 38, 38, 0.45);
    font-size: 13px;
  }
  .touch-btn-brake.active {
    background: radial-gradient(circle at 40% 35%, #fca5a5, #ef4444);
    box-shadow: 0 2px 24px rgba(220, 38, 38, 0.70);
  }

  .touch-btn-drift {
    width: 58px;
    height: 58px;
    background: radial-gradient(circle at 40% 35%, #c084fc, #9333ea);
    box-shadow: 0 4px 16px rgba(147, 51, 234, 0.45);
    font-size: 12px;
  }
  .touch-btn-drift.active {
    background: radial-gradient(circle at 40% 35%, #d8b4fe, #a855f7);
    box-shadow: 0 2px 24px rgba(147, 51, 234, 0.70);
  }
`;

/* ── 常量 ── */

/** 摇杆最大偏移半径（像素） */
const JOYSTICK_RADIUS = 42;
/** 摇杆死区比例（0 ~ 1，中心区域忽略微小移动） */
const DEAD_ZONE = 0.18;
/** 摇杆平滑滤波系数（0 ~ 1，越大越跟手） */
const SMOOTH_FACTOR = 0.45;

export class TouchInput {
  constructor() {
    /** @type {boolean} 是否已完成初始化 */
    this._initialized = false;

    // ── 输入状态 ──
    /** @type {number} -1 ~ 1 */
    this._steer = 0;
    /** @type {number} 0 或 1 */
    this._throttle = 0;
    /** @type {number} 0 或 1 */
    this._brake = 0;
    /** @type {boolean} */
    this._drift = false;

    // ── 摇杆跟踪 ──
    /** @type {number|null} 摇杆的 pointerId */
    this._joystickPointerId = null;
    /** @type {{x:number, y:number}} 摇杆基点（DOM 坐标） */
    this._joystickBase = { x: 0, y: 0 };
    /** 摇杆目标的归一化偏移（死区前），用于插值平滑 */
    this._joystickTargetX = 0;

    // ── 按钮跟踪 ──
    /** @type {Object<string, number|null>} 各按钮的 pointerId */
    this._btnPointers = { throttle: null, brake: null, drift: null };

    // ── DOM ──
    /** @type {HTMLElement|null} */
    this._overlay = null;
    /** @type {HTMLElement|null} */
    this._joystickEl = null;
    /** @type {HTMLElement|null} */
    this._joystickThumb = null;
    /** @type {HTMLElement|null} */
    this._btnThrottle = null;
    /** @type {HTMLElement|null} */
    this._btnBrake = null;
    /** @type {HTMLElement|null} */
    this._btnDrift = null;

    // 绑定事件处理器
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  /**
   * 触摸输入是否可用（设备支持触摸）
   * @returns {boolean}
   */
  static isSupported() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * 注入触摸控件的 CSS 样式（仅初始化时执行一次）
   * @private
   */
  _injectStyles() {
    if (TouchInput._stylesInjected) return;
    TouchInput._stylesInjected = true;
    const el = document.createElement('style');
    el.textContent = TOUCH_STYLES;
    document.head.appendChild(el);
  }

  /**
   * 初始化：仅在触摸可用时创建 UI
   * @param {HTMLElement} container 挂载容器
   */
  init(container) {
    if (this._initialized) return;

    this._injectStyles();
    this._createUI(container);
    this._bindEvents();

    this._initialized = true;
  }

  destroy() {
    if (!this._initialized) return;
    this._unbindEvents();
    if (this._overlay && this._overlay.parentNode) {
      this._overlay.parentNode.removeChild(this._overlay);
    }
    this._initialized = false;
  }

  // ── 公开查询 ──

  /** 摇杆是否处于活跃状态 */
  isActive() {
    return this._joystickPointerId !== null || this._throttle > 0 || this._brake > 0 || this._drift;
  }

  /** 原始转向值 */
  getRawSteer() {
    return this._steer;
  }

  /** 原始油门值 */
  getRawThrottle() {
    return this._throttle;
  }

  /** 原始刹车值 */
  getRawBrake() {
    return this._brake;
  }

  /** 漂移按钮是否按住 */
  isDriftPressed() {
    return this._drift;
  }

  /** 帧结束清理（Touch 无需清理，占位用） */
  endFrame() { /* no-op */ }

  // ── UI 构建 ──

  /**
   * @private
   */
  _createUI(container) {
    this._overlay = document.createElement('div');
    this._overlay.className = 'touch-input-overlay';

    // 摇杆
    this._joystickEl = document.createElement('div');
    this._joystickEl.className = 'touch-joystick';
    this._joystickThumb = document.createElement('div');
    this._joystickThumb.className = 'touch-joystick-thumb';
    this._joystickEl.appendChild(this._joystickThumb);
    this._overlay.appendChild(this._joystickEl);

    // 按钮
    const btnContainer = document.createElement('div');
    btnContainer.className = 'touch-buttons';

    this._btnThrottle = this._createButton('油门', 'touch-btn-throttle');
    this._btnBrake = this._createButton('刹车', 'touch-btn-brake');
    this._btnDrift = this._createButton('漂移', 'touch-btn-drift');

    btnContainer.appendChild(this._btnThrottle);
    btnContainer.appendChild(this._btnBrake);
    btnContainer.appendChild(this._btnDrift);
    this._overlay.appendChild(btnContainer);

    container.appendChild(this._overlay);
  }

  /**
   * @private
   * @param {string} label
   * @param {string} className
   * @returns {HTMLButtonElement}
   */
  _createButton(label, className) {
    const btn = document.createElement('button');
    btn.className = `touch-btn ${className}`;
    btn.textContent = label;
    btn.setAttribute('aria-label', label);
    return btn;
  }

  // ── 事件绑定 ──

  /** @private */
  _bindEvents() {
    const el = this._overlay;
    if (!el) return;
    // 使用 pointer events 统一触屏 + 鼠标
    el.addEventListener('pointerdown', this._onPointerDown);
    // pointermove / pointerup 注册在 document 层，确保拖拽出元素后仍能接收
    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
    document.addEventListener('pointercancel', this._onPointerUp);
  }

  /** @private */
  _unbindEvents() {
    const el = this._overlay;
    if (el) el.removeEventListener('pointerdown', this._onPointerDown);
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    document.removeEventListener('pointercancel', this._onPointerUp);
  }

  // ── Pointer 事件处理 ──

  /**
   * @private
   * @param {PointerEvent} e
   */
  _onPointerDown(e) {
    /** @type {HTMLElement} */
    const target = e.target;

    // 摇杆点击
    if (target === this._joystickEl || target === this._joystickThumb || this._joystickEl.contains(target)) {
      if (this._joystickPointerId !== null) return; // 已有一个摇杆手势
      this._joystickPointerId = e.pointerId;
      this._overlay.classList.add('is-active');

      const rect = this._joystickEl.getBoundingClientRect();
      this._joystickBase.x = rect.left + rect.width / 2;
      this._joystickBase.y = rect.top + rect.height / 2;

      this._updateJoystick(e.clientX, e.clientY);
      return;
    }

    // 按钮点击
    if (target === this._btnThrottle) {
      if (this._btnPointers.throttle !== null) return;
      this._btnPointers.throttle = e.pointerId;
      this._throttle = 1;
      target.classList.add('active');
      return;
    }
    if (target === this._btnBrake) {
      if (this._btnPointers.brake !== null) return;
      this._btnPointers.brake = e.pointerId;
      this._brake = 1;
      target.classList.add('active');
      return;
    }
    if (target === this._btnDrift) {
      if (this._btnPointers.drift !== null) return;
      this._btnPointers.drift = e.pointerId;
      this._drift = true;
      target.classList.add('active');
      return;
    }
  }

  /**
   * @private
   * @param {PointerEvent} e
   */
  _onPointerMove(e) {
    // 更新摇杆
    if (this._joystickPointerId !== null && e.pointerId === this._joystickPointerId) {
      this._updateJoystick(e.clientX, e.clientY);
    }
  }

  /**
   * @private
   * @param {PointerEvent} e
   */
  _onPointerUp(e) {
    // 释放摇杆
    if (this._joystickPointerId !== null && e.pointerId === this._joystickPointerId) {
      this._joystickPointerId = null;
      this._steer = 0;
      this._joystickTargetX = 0;
      this._resetJoystickThumb();
      // 检查是否还有活跃触摸
      if (this._throttle === 0 && this._brake === 0 && !this._drift) {
        this._overlay.classList.remove('is-active');
      }
      return;
    }

    // 释放按钮
    for (const [name, pid] of Object.entries(this._btnPointers)) {
      if (pid === e.pointerId) {
        this._btnPointers[name] = null;
        if (name === 'throttle') {
          this._throttle = 0;
          this._btnThrottle.classList.remove('active');
        } else if (name === 'brake') {
          this._brake = 0;
          this._btnBrake.classList.remove('active');
        } else if (name === 'drift') {
          this._drift = false;
          this._btnDrift.classList.remove('active');
        }
        // 检查是否还有活跃触摸
        if (this._joystickPointerId === null && this._throttle === 0 && this._brake === 0 && !this._drift) {
          this._overlay.classList.remove('is-active');
        }
        return; // 一次只处理一个 pointerId
      }
    }
  }

  // ── 摇杆计算 ──

  /**
   * @private
   * @param {number} clientX
   * @param {number} clientY
   */
  _updateJoystick(clientX, clientY) {
    const dx = clientX - this._joystickBase.x;
    const dy = clientY - this._joystickBase.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 归一化方向向量
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;
    // 实际半径（限制在最大半径内）
    const radius = Math.min(dist, JOYSTICK_RADIUS);

    // 计算归一化值（0 ~ 1），施加死区
    let normalized = radius / JOYSTICK_RADIUS;
    if (normalized < DEAD_ZONE) {
      normalized = 0;
    } else {
      // 将死区以上的部分重新映射到 0 ~ 1
      normalized = (normalized - DEAD_ZONE) / (1 - DEAD_ZONE);
    }

    // 目标值 = 方向 × 归一化强度（仅水平分量用于转向）
    this._joystickTargetX = nx * normalized;

    // 平滑插值（一阶低通滤波）
    this._steer = this._steer * SMOOTH_FACTOR + this._joystickTargetX * (1 - SMOOTH_FACTOR);
    // 钳位
    this._steer = Math.max(-1, Math.min(1, this._steer));

    // 更新摇杆滑块位置
    const thumbX = nx * radius;
    const thumbY = ny * radius;
    this._joystickThumb.style.transform =
      `translate(${thumbX}px, ${thumbY}px)`;
  }

  /** @private */
  _resetJoystickThumb() {
    this._joystickThumb.style.transform = 'translate(0, 0)';
    this._steer = 0;
  }
}
