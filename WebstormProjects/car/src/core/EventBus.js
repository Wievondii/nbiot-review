/**
 * @file 事件总线
 *
 * 游戏内的发布-订阅事件系统。
 * 所有跨模块通信必须通过 EventBus 进行，禁止模块间直接引用。
 */

import { EVENT_STATE_CHANGE } from '../types.js';

export class EventBus {
  constructor() {
    /** @type {Object<string, Function[]>} 事件名 → 回调列表 */
    this._listeners = {};
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数，接收 (data) => void
   * @returns {Function} 取消订阅函数（方便在组件销毁时取消）
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);

    // 返回 unsubscribe 函数，调用者可以保存并在需要时取消
    return () => this.off(event, callback);
  }

  /**
   * 取消订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 要移除的回调函数
   */
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(
      (cb) => cb !== callback
    );
    // 清理空数组
    if (this._listeners[event].length === 0) {
      delete this._listeners[event];
    }
  }

  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {*} [data] - 事件数据
   */
  emit(event, data) {
    const callbacks = this._listeners[event];
    if (!callbacks || callbacks.length === 0) return;
    // 复制一份，防止回调中修改 listeners 导致遍历异常
    [...callbacks].forEach((cb) => {
      cb(data);
    });
  }

  /**
   * 一次性订阅：触发后自动取消
   * @param {string} event
   * @param {Function} callback
   * @returns {Function} 取消订阅函数
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * 移除指定事件的所有监听器
   * @param {string} [event] - 事件名，不传则清除所有事件
   */
  clear(event) {
    if (event) {
      delete this._listeners[event];
    } else {
      this._listeners = {};
    }
  }
}
