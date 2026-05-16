/**
 * 输入映射器
 *
 * 实现 InputController 接口（getState / onAction）：
 * - 聚合键盘（KeyboardInput）和触摸（TouchInput）输入
 * - 平滑转向值，消除数字键的抖动
 * - 检测状态变化并触发 onAction 回调
 * - 提供统一的 InputState（throttle / brake / steer / drift / pause）
 */

import { KeyboardInput } from './Keyboard.js';
import { TouchInput } from './Touch.js';

/** 转向渐进速度（从 0 到 ±1 所需时间倒数） */
const STEER_RAMP_UP = 5.0;     // 0→1 约 200ms
/** 转向回正速度 */
const STEER_RAMP_DOWN = 8.0;   // 1→0 约 125ms
/** 变化触发阈值（低于此值认为无变化） */
const CHANGE_THRESHOLD = 0.005;

export class InputMapper {
  constructor() {
    this._keyboard = new KeyboardInput();
    /** @type {TouchInput|null} */
    this._touch = null;

    // ── 当前输出状态（含平滑后值） ──
    /** @type {InputState} */
    this._state = {
      throttle: 0,
      brake: 0,
      steer: 0,
      drift: false,
      pause: false,
    };

    // ── 平滑中间状态 ──
    /** @type {number} 平滑后的转向值 */
    this._smoothSteer = 0;
    /** @type {number} 上一帧时间戳（ms） */
    this._lastTime = performance.now();

    // ── 上一次的原始输入（用于变化检测） ──
    this._prevRaw = {
      throttle: false,
      brake: false,
      steer: 0,
      drift: false,
      pause: false,
    };

    // ── 动作回调 ──
    /** @type {Object<string, Function[]>} */
    this._callbacks = {};

    /** @type {boolean} */
    this._initialized = false;
  }

  // ── 生命周期 ──

  /**
   * 初始化输入系统
   * @param {HTMLElement} [container] 触摸控件的挂载容器
   */
  init(container) {
    if (this._initialized) return;

    this._keyboard.init();

    if (container && TouchInput.isSupported()) {
      this._touch = new TouchInput();
      this._touch.init(container);
    }

    this._initialized = true;
    this._lastTime = performance.now();
  }

  /**
   * 销毁输入系统
   */
  destroy() {
    if (!this._initialized) return;
    this._keyboard.destroy();
    if (this._touch) {
      this._touch.destroy();
      this._touch = null;
    }
    this._callbacks = {};
    this._initialized = false;
  }

  // ── InputController 接口实现 ──

  /**
   * 注册动作回调。当指定动作的状态发生变化时调用。
   * 支持的动作：throttle / brake / steer / drift / pause
   *
   * @param {string} action 动作名称
   * @param {(value: number|boolean) => void} callback 回调函数，参数为新值
   */
  onAction(action, callback) {
    if (!this._callbacks[action]) {
      this._callbacks[action] = [];
    }
    this._callbacks[action].push(callback);
  }

  /**
   * 获取当前帧的输入状态。
   * 每调用一次即推进一帧，内部会计算平滑值、触发回调并清理瞬态状态。
   *
   * @returns {InputState}
   */
  getState() {
    if (!this._initialized) {
      return { throttle: 0, brake: 0, steer: 0, drift: false, pause: false };
    }

    const now = performance.now();
    const dt = Math.min((now - this._lastTime) / 1000, 0.05); // 限制最大 dt = 50ms
    this._lastTime = now;

    // ── 1. 读取原始输入 ──
    const raw = this._collectRawInput();

    // ── 2. 平滑转向 ──
    this._smoothSteer = this._smoothValue(
      this._smoothSteer,
      raw.steer,
      dt,
      STEER_RAMP_UP,
      STEER_RAMP_DOWN,
    );

    // ── 3. 构建状态 ──
    this._state.throttle = raw.throttle ? 1 : 0;
    this._state.brake = raw.brake ? 1 : 0;
    this._state.steer = this._smoothSteer;
    this._state.drift = raw.drift;
    this._state.pause = raw.pause; // pause 是瞬态的，只在按下时 true

    // ── 4. 触发回调 ──
    this._fireChanged('throttle', this._state.throttle, this._prevRaw.throttle ? 1 : 0);
    this._fireChanged('brake', this._state.brake, this._prevRaw.brake ? 1 : 0);
    this._fireChanged('steer', this._state.steer, this._prevRaw.steer);
    this._fireChanged('drift', this._state.drift, this._prevRaw.drift);

    // pause: 只触发按下事件（toggle 模式），不触发释放
    if (raw.pause && !this._prevRaw.pause) {
      this._fireCallbacks('pause', true);
    }

    // ── 5. 更新前帧原始值备份 ──
    this._prevRaw.throttle = raw.throttle;
    this._prevRaw.brake = raw.brake;
    this._prevRaw.steer = raw.steer;
    this._prevRaw.drift = raw.drift;
    this._prevRaw.pause = raw.pause;

    // ── 6. 帧结束清理 ──
    this._keyboard.endFrame();
    if (this._touch) this._touch.endFrame();

    // 返回副本，防止外部篡改
    return { ...this._state };
  }

  // ── 内部方法 ──

  /**
   * 收集键盘 + 触摸的原始输入
   * @private
   * @returns {{ throttle: boolean, brake: boolean, steer: number, drift: boolean, pause: boolean }}
   */
  _collectRawInput() {
    const kbSteer = this._keyboard.getRawSteer();
    const kbThrottle = this._keyboard.getRawThrottle() > 0;
    const kbBrake = this._keyboard.getRawBrake() > 0;
    const kbDrift = this._keyboard.isDriftPressed();
    const kbPause = this._keyboard.isPauseJustPressed();

    if (!this._touch) {
      return { throttle: kbThrottle, brake: kbBrake, steer: kbSteer, drift: kbDrift, pause: kbPause };
    }

    const touchSteer = this._touch.getRawSteer();
    const touchThrottle = this._touch.getRawThrottle() > 0;
    const touchBrake = this._touch.getRawBrake() > 0;
    const touchDrift = this._touch.isDriftPressed();

    // 转向：如果触摸摇杆活跃，优先用触摸的模拟值；否则用键盘的数字值
    const steer = this._touch.isActive() && Math.abs(touchSteer) > CHANGE_THRESHOLD
      ? touchSteer
      : kbSteer;

    return {
      throttle: kbThrottle || touchThrottle,
      brake: kbBrake || touchBrake,
      steer,
      drift: kbDrift || touchDrift,
      pause: kbPause,
    };
  }

  /**
   * 一阶平滑
   * @private
   * @param {number} current
   * @param {number} target
   * @param {number} dt
   * @param {number} rampUp 上升速率（/秒）
   * @param {number} rampDown 下降速率（/秒）
   * @returns {number}
   */
  _smoothValue(current, target, dt, rampUp, rampDown) {
    if (Math.abs(current - target) < CHANGE_THRESHOLD) return target;

    const speed = Math.abs(target) > 0.001 ? rampUp : rampDown;
    const maxStep = speed * dt;
    const diff = target - current;

    if (Math.abs(diff) <= maxStep) return target;
    return current + Math.sign(diff) * maxStep;
  }

  /**
   * 当值变化时触发回调
   * @private
   * @param {string} action
   * @param {number|boolean} newVal
   * @param {number|boolean} oldVal
   */
  _fireChanged(action, newVal, oldVal) {
    if (newVal === oldVal) return;
    this._fireCallbacks(action, newVal);
  }

  /**
   * 触发指定动作的所有回调
   * @private
   * @param {string} action
   * @param {*} value
   */
  _fireCallbacks(action, value) {
    const cbs = this._callbacks[action];
    if (!cbs) return;
    for (let i = 0; i < cbs.length; i++) {
      try {
        cbs[i](value);
      } catch (err) {
        console.warn(`[InputMapper] onAction('${action}') callback error:`, err);
      }
    }
  }
}
