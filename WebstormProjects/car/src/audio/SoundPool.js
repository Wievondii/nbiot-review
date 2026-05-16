/**
 * SoundPool - 声音池
 * ====================
 * 管理可重用的 Web Audio API GainNode 组合，
 * 用于播放一次性音效，控制最大并发音频实例数量，
 * 并在播放完毕后自动回收实例。
 *
 * 职责：
 *  - 预分配 GainNode 池
 *  - acquire/release 模式管理
 *  - 超限时自动回收最早活跃的实例
 *
 * @module SoundPool
 */

export class SoundPool {
  /**
   * @param {AudioContext} audioContext - Web Audio API 上下文
   * @param {number} [maxInstances=8] - 最大并发音效实例数
   */
  constructor(audioContext, maxInstances = 8) {
    /** @type {AudioContext} */
    this._ctx = audioContext;

    /** @type {number} */
    this._max = maxInstances;

    /** @type {GainNode[]} 空闲池 */
    this._idle = [];

    /** @type {GainNode[]} 活跃池 */
    this._active = [];

    // 预分配 GainNode
    for (let i = 0; i < this._max; i++) {
      this._idle.push(this._ctx.createGain());
    }
  }

  /**
   * 获取一个空闲声音通道（GainNode）。
   * 调用方应将音频源连接到此节点，并在播放完毕后调用 release()。
   *
   * @returns {GainNode|null} 可用的 GainNode，池满时返回最早活跃的节点
   */
  acquire() {
    if (this._idle.length > 0) {
      const node = this._idle.pop();
      this._active.push(node);
      return node;
    }

    // 超限：回收最早活跃的实例（强制复用）
    if (this._active.length > 0) {
      console.warn('[SoundPool] 超限，强制回收最早活跃通道');
      const node = this._active.shift();
      return node;
    }

    return null;
  }

  /**
   * 释放声音通道回池。
   * 重置 gain 值，断开所有连接，放回空闲池。
   *
   * @param {GainNode} node - 要释放的 GainNode
   */
  release(node) {
    const idx = this._active.indexOf(node);
    if (idx !== -1) {
      this._active.splice(idx, 1);
    }

    // 重置调度状态
    try {
      node.gain.cancelScheduledValues(this._ctx.currentTime);
    } catch (_) {
      // 安全忽略
    }
    node.gain.value = 1;

    // 断开所有连接（不影响上游 oscillator 已 stop）
    try {
      node.disconnect();
    } catch (_) {
      // 安全忽略
    }

    this._idle.push(node);
  }

  /**
   * 当前可用通道数
   * @type {number}
   */
  get available() {
    return this._idle.length;
  }

  /**
   * 当前活跃通道数
   * @type {number}
   */
  get activeCount() {
    return this._active.length;
  }

  /**
   * 清空所有池
   */
  dispose() {
    this._idle.length = 0;
    this._active.length = 0;
  }
}
