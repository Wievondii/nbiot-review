/**
 * 键盘输入模块
 * 处理键盘按键的按下/释放状态追踪，支持 justPressed/justReleased 瞬态检测。
 * 提供 WASD / 方向键 / 空格 / ESC 键映射。
 */

/** 按键码 → 游戏动作映射表 */
export const KEY_ACTIONS = {
  // WASD
  KeyW: 'throttle',
  KeyS: 'brake',
  KeyA: 'steerLeft',
  KeyD: 'steerRight',
  // 方向键
  ArrowUp: 'throttle',
  ArrowDown: 'brake',
  ArrowLeft: 'steerLeft',
  ArrowRight: 'steerRight',
  // 功能键
  Space: 'drift',
  Escape: 'pause',
};

/**
 * 按键映射（code → action 反向查表，用于仅按动作名查询）
 * @type {Object<string, string[]>}
 */
const ACTION_KEYS = {};
for (const [code, action] of Object.entries(KEY_ACTIONS)) {
  if (!ACTION_KEYS[action]) ACTION_KEYS[action] = [];
  ACTION_KEYS[action].push(code);
}

export class KeyboardInput {
  constructor() {
    /** @type {Set<string>} 当前按下的键 */
    this._pressed = new Set();
    /** @type {Set<string>} 本帧新按下的键 */
    this._justPressed = new Set();
    /** @type {Set<string>} 本帧新释放的键 */
    this._justReleased = new Set();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
  }

  /**
   * 启动键盘监听
   */
  init() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  /**
   * 停止键盘监听并清空状态
   */
  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._pressed.clear();
    this._justPressed.clear();
    this._justReleased.clear();
  }

  /**
   * 结束当前帧，清除瞬态状态。每帧末尾调用一次
   */
  endFrame() {
    this._justPressed.clear();
    this._justReleased.clear();
  }

  // ── 按键状态查询 ──

  /**
   * 按键是否被按住
   * @param {string} code 按键码（如 'KeyW', 'ArrowUp'）
   * @returns {boolean}
   */
  isPressed(code) {
    return this._pressed.has(code);
  }

  /**
   * 按键是否在本帧被按下（瞬态，仅当帧有效）
   * @param {string} code
   * @returns {boolean}
   */
  isJustPressed(code) {
    return this._justPressed.has(code);
  }

  /**
   * 按键是否在本帧被释放（瞬态，仅当帧有效）
   * @param {string} code
   * @returns {boolean}
   */
  isJustReleased(code) {
    return this._justReleased.has(code);
  }

  // ── 原始输入值 ──

  /**
   * 原始转向值，由 A/D/←/→ 产生
   * @returns {number} -1（左）、0（中）、1（右）
   */
  getRawSteer() {
    let steer = 0;
    if (this.isPressed('KeyA') || this.isPressed('ArrowLeft')) steer -= 1;
    if (this.isPressed('KeyD') || this.isPressed('ArrowRight')) steer += 1;
    return steer;
  }

  /**
   * 原始油门值，由 W/↑ 产生
   * @returns {number} 0 或 1
   */
  getRawThrottle() {
    return this.isPressed('KeyW') || this.isPressed('ArrowUp') ? 1 : 0;
  }

  /**
   * 原始刹车值，由 S/↓ 产生
   * @returns {number} 0 或 1
   */
  getRawBrake() {
    return this.isPressed('KeyS') || this.isPressed('ArrowDown') ? 1 : 0;
  }

  /**
   * 漂移键（空格）是否被按住
   * @returns {boolean}
   */
  isDriftPressed() {
    return this.isPressed('Space');
  }

  /**
   * 暂停键（ESC）是否在本帧被按下
   * @returns {boolean}
   */
  isPauseJustPressed() {
    return this.isJustPressed('Escape');
  }

  // ── 事件处理 ──

  /** @private */
  _onKeyDown(e) {
    const action = KEY_ACTIONS[e.code];
    if (!action) return;

    e.preventDefault();
    if (!this._pressed.has(e.code)) {
      this._justPressed.add(e.code);
    }
    this._pressed.add(e.code);
  }

  /** @private */
  _onKeyUp(e) {
    const action = KEY_ACTIONS[e.code];
    if (!action) return;

    e.preventDefault();
    this._pressed.delete(e.code);
    this._justReleased.add(e.code);
  }
}
