/**
 * @file 游戏状态机
 *
 * 使用明确的状态转换规则驱动游戏流程。
 * 状态转换图:
 *   menu → countdown → racing ↔ paused → finished → menu
 *
 * 关键约束:
 * - setState() 总是触发新状态的 onEnter 回调（即使同名状态）
 * - onEnter/onExit/onStateChange 必须在 setState 之前注册
 */

import {
  STATE_MENU,
  STATE_TRANSITIONS,
  VALID_STATES,
  EVENT_STATE_CHANGE,
} from '../types.js';

export class GameState {
  /**
   * @param {import('../types.js').IEventBus} eventBus - 事件总线实例
   */
  constructor(eventBus) {
    /** @type {import('../types.js').EventBus} */
    this.eventBus = eventBus;

    /** @type {string|null} 当前状态 */
    this.current = null;

    /** @type {string|null} 上一个状态 */
    this.previous = null;

    /** @type {Object<string, Function>} 状态进入回调 */
    this._enterCallbacks = {};

    /** @type {Object<string, Function>} 状态退出回调 */
    this._exitCallbacks = {};

    /** @type {Function[]} 全局状态变更回调 */
    this._changeCallbacks = [];
  }

  /**
   * 设置游戏状态。
   * 总是触发新状态的 onEnter 回调（即使当前状态与新状态相同）。
   * 必须先注册回调，再调用 setState。
   *
   * @param {string} newState - 目标状态，必须是 VALID_STATES 中的值
   * @param {*} [data] - 可选附加数据，传递给回调
   */
  setState(newState, data) {
    if (!VALID_STATES.includes(newState)) {
      console.warn(`[GameState] 无效状态: ${newState}`);
      return;
    }

    // 检查转换合法性
    // - 首次设置状态（current === null）时跳过检查
    // - 同名状态切换（re-entry）时跳过检查，保证 onEnter 总是触发
    if (
      this.current !== null &&
      newState !== this.current &&
      !this.isValidTransition(newState)
    ) {
      console.warn(
        `[GameState] 非法状态转换: ${this.current} → ${newState}`
      );
      return;
    }

    this.previous = this.current;
    this.current = newState;

    // 1. 触发上一个状态的 onExit 回调
    if (this.previous !== null && this._exitCallbacks[this.previous]) {
      this._exitCallbacks[this.previous](data);
    }

    // 2. 触发新状态的 onEnter 回调（总是触发，包括同名状态切换）
    if (this._enterCallbacks[this.current]) {
      this._enterCallbacks[this.current](data);
    }

    // 3. 触发全局 onStateChange 回调
    this._changeCallbacks.forEach((cb) => {
      cb(this.current, this.previous, data);
    });

    // 4. 通过事件总线广播状态变更
    if (this.eventBus) {
      this.eventBus.emit(EVENT_STATE_CHANGE, {
        from: this.previous,
        to: this.current,
        data,
      });
    }
  }

  /**
   * 注册状态进入回调。
   * 重要：必须在 setState 之前调用。
   *
   * @param {string} state - 状态名
   * @param {Function} callback - (data) => void
   */
  onEnter(state, callback) {
    this._enterCallbacks[state] = callback;
  }

  /**
   * 注册状态退出回调。
   *
   * @param {string} state - 状态名
   * @param {Function} callback - (data) => void
   */
  onExit(state, callback) {
    this._exitCallbacks[state] = callback;
  }

  /**
   * 注册全局状态变更回调（每次状态变化都触发）
   *
   * @param {Function} callback - (newState, prevState, data) => void
   */
  onStateChange(callback) {
    this._changeCallbacks.push(callback);
  }

  /**
   * 判断当前是否处于指定状态
   *
   * @param {string} state
   * @returns {boolean}
   */
  is(state) {
    return this.current === state;
  }

  /**
   * 检查状态转换是否合法
   *
   * @param {string} newState
   * @returns {boolean}
   */
  isValidTransition(newState) {
    const allowed = STATE_TRANSITIONS[this.current];
    return allowed ? allowed.includes(newState) : false;
  }
}
