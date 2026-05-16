/**
 * 赛道加载器
 * @module track/TrackLoader
 *
 * 负责从 JSON 对象加载赛道数据、验证数据完整性、支持多赛道切换。
 * 通过 EventBus 通知赛道切换事件（loadTrack / trackChanged）。
 */
import { TRACKS, DEFAULT_TRACK, validateTrackData } from './TrackData.js';

export class TrackLoader {
  constructor() {
    /** @type {Map<string, object>} */
    this._tracks = new Map();

    /** @type {object|null} */
    this._currentTrack = null;

    /** @type {string|null} */
    this._currentName = null;

    /** @type {Map<string, string>} 赛道别名映射 */
    this._aliases = new Map();

    /** @type {Function|null} */
    this._onTrackChanged = null;

    // 注册默认赛道
    this._registerDefaults();
  }

  /**
   * 注册预设赛道和别名
   */
  _registerDefaults() {
    for (const [name, track] of TRACKS) {
      this.registerTrack(name, track);
    }
    // 注册别名：UI 菜单中的赛道名 → 实际赛道
    this.registerAlias('circuit', 'motor-speedway');
  }

  /**
   * 注册一个赛道供后续加载
   * @param {string} name - 赛道唯一标识名
   * @param {object} trackData - 符合 TrackData 接口的数据
   * @returns {boolean} 注册是否成功
   */
  registerTrack(name, trackData) {
    if (typeof name !== 'string' || name.length === 0) {
      console.warn('[TrackLoader] 赛道名称无效');
      return false;
    }
    const validation = validateTrackData(trackData);
    if (!validation.valid) {
      console.warn(`[TrackLoader] 赛道 "${name}" 数据不完整:`, validation.errors);
      return false;
    }
    this._tracks.set(name, this._deepClone(trackData));
    return true;
  }

  /**
   * 注册赛道别名
   * @param {string} alias - 别名
   * @param {string} target - 实际赛道名称
   * @returns {boolean} 注册是否成功
   */
  registerAlias(alias, target) {
    if (typeof alias !== 'string' || alias.length === 0) {
      return false;
    }
    if (!this._tracks.has(target)) {
      console.warn(`[TrackLoader] 别名 "${alias}" 指向的赛道 "${target}" 不存在`);
      return false;
    }
    this._aliases.set(alias, target);
    return true;
  }

  /**
   * 根据名称加载赛道数据
   * 如果名称未直接注册，会尝试解析别名
   * @param {string} name - 赛道名称或别名
   * @returns {object|null} 赛道数据的深拷贝；未找到返回 null
   */
  loadTrack(name) {
    let actualName = name;

    // 解析别名
    if (this._aliases.has(name)) {
      actualName = this._aliases.get(name);
    }

    const track = this._tracks.get(actualName);
    if (!track) {
      console.warn(`[TrackLoader] 未找到赛道: "${name}"，可用赛道: [${this.getTrackNames().join(', ')}]`);
      return null;
    }
    this._currentName = name;
    this._currentTrack = this._deepClone(track);
    this._emitChanged();
    return this._currentTrack;
  }

  /**
   * 从自定义 JSON 对象加载赛道（不提前注册）
   * @param {object} jsonData - 符合 TrackData 接口的对象
   * @returns {object|null} 加载成功返回数据副本，失败返回 null
   */
  loadFromJSON(jsonData) {
    const validation = validateTrackData(jsonData);
    if (!validation.valid) {
      console.warn('[TrackLoader] 自定义赛道数据无效:', validation.errors);
      return null;
    }
    this._currentName = jsonData.name;
    this._currentTrack = this._deepClone(jsonData);
    this._emitChanged();
    return this._currentTrack;
  }

  /**
   * 获取当前已加载的赛道数据
   * @returns {object|null}
   */
  getCurrentTrack() {
    return this._currentTrack;
  }

  /**
   * 获取当前赛道名称
   * @returns {string|null}
   */
  getCurrentTrackName() {
    return this._currentName;
  }

  /**
   * 获取所有已注册的赛道名称列表
   * @returns {string[]}
   */
  getTrackNames() {
    return Array.from(this._tracks.keys());
  }

  /**
   * 获取所有别名映射
   * @returns {object} { alias: targetName, ... }
   */
  getTrackAliases() {
    const result = {};
    for (const [alias, target] of this._aliases) {
      result[alias] = target;
    }
    return result;
  }

  /**
   * 判断名称是否为已注册的赛道（含别名）
   * @param {string} name
   * @returns {boolean}
   */
  hasTrack(name) {
    return this._tracks.has(name) || this._aliases.has(name);
  }

  /**
   * 注册赛道变更回调
   * @param {Function} callback - 接收 (trackData, trackName) 的回调
   */
  onTrackChanged(callback) {
    this._onTrackChanged = callback;
  }

  /**
   * 触发赛道变更事件
   */
  _emitChanged() {
    if (this._onTrackChanged && this._currentTrack) {
      this._onTrackChanged(this._currentTrack, this._currentName);
    }
  }

  /**
   * 深拷贝对象
   * @param {object} obj
   * @returns {object}
   */
  _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * 重置加载器（清除所有赛道状态）
   */
  reset() {
    this._tracks.clear();
    this._aliases.clear();
    this._currentTrack = null;
    this._currentName = null;
    this._onTrackChanged = null;
    this._registerDefaults();
  }

  /**
   * 释放资源
   */
  destroy() {
    this._tracks.clear();
    this._aliases.clear();
    this._currentTrack = null;
    this._currentName = null;
    this._onTrackChanged = null;
  }
}
