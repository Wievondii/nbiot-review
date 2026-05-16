/**
 * @file UI 管理器
 *
 * 整合 HUD、Menu、Countdown 三个 UI 组件，对外暴露统一的 IUIManager 接口。
 * 各 UI 组件通过 DOM 覆盖在 Canvas 上方。
 */

import { HUD } from './HUD.js';
import { Menu } from './Menu.js';
import { Countdown } from './Countdown.js';
import {
  EVENT_COUNTDOWN_COMPLETE,
} from '../types.js';

export class UIManager {
  /**
   * @param {HTMLCanvasElement} canvas - Canvas 元素，用于获取父容器
   * @param {import('../types.js').IEventBus} eventBus - 事件总线
   */
  constructor(canvas, eventBus) {
    /** @type {HTMLElement} UI 挂载容器（Canvas 父元素） */
    this.container = canvas.parentElement;

    /** @type {EventBus} */
    this.eventBus = eventBus;

    /** @type {HUD} */
    this.hud = new HUD(this.container);

    /** @type {Menu} */
    this.menu = new Menu(this.container);

    /** @type {Countdown} */
    this.countdown = new Countdown(this.container);

    /** @type {HTMLElement|null} 暂停覆盖层 */
    this._pauseOverlay = null;

    /** @type {HTMLElement|null} 结果覆盖层 */
    this._resultsOverlay = null;

    /** @type {string} 当前选中的赛道 ID */
    this._selectedTrack = 'circuit';
  }

  // ================================================================
  // 菜单
  // ================================================================

  /** 显示主菜单 */
  showMenu() {
    this.menu.show({
      onStart: () => {
        this.eventBus.emit('action', 'start');
      },
      onTrackSelect: (trackId) => {
        this._selectedTrack = trackId;
      },
    });
  }

  /** 隐藏主菜单 */
  hideMenu() {
    this.menu.hide();
  }

  /** 获取当前选中的赛道 ID */
  getSelectedTrack() {
    return this._selectedTrack;
  }

  // ================================================================
  // 倒计时
  // ================================================================

  /**
   * 显示倒计时。
   * Countdown 组件内部通过 setTimeout 驱动 3→2→1→GO!，
   * 完成后通过事件总线通知 GameLoop。
   *
   * @param {number} _value - 倒计时初始值（未使用，Countdown 内部管理）
   */
  showCountdown(_value) {
    this.countdown.start(() => {
      this.eventBus.emit(EVENT_COUNTDOWN_COMPLETE);
    });
  }

  /** 隐藏倒计时 */
  hideCountdown() {
    this.countdown.stop();
  }

  // ================================================================
  // 暂停
  // ================================================================

  /** 显示暂停菜单（简易 DOM 覆盖层） */
  showPauseMenu() {
    if (this._pauseOverlay) return;

    const overlay = document.createElement('div');
    overlay.id = 'pause-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.7);
      z-index: 60;
      font-family: 'Courier New', 'Consolas', monospace;
      color: #ffffff;
    `;

    const title = document.createElement('div');
    title.textContent = 'PAUSED';
    title.style.cssText = `
      font-size: clamp(36px, 6vw, 72px);
      font-weight: 900;
      letter-spacing: 8px;
      color: #00f0ff;
      text-shadow: 0 0 30px #00f0ff66;
      margin-bottom: 20px;
    `;

    const hint = document.createElement('div');
    hint.textContent = 'Press P / ESC to resume';
    hint.style.cssText = `
      font-size: 16px;
      letter-spacing: 2px;
      color: #888;
    `;

    overlay.appendChild(title);
    overlay.appendChild(hint);
    this.container.appendChild(overlay);
    this._pauseOverlay = overlay;
  }

  /** 隐藏暂停菜单 */
  hidePauseMenu() {
    if (this._pauseOverlay) {
      this._pauseOverlay.remove();
      this._pauseOverlay = null;
    }
  }

  // ================================================================
  // 比赛结果
  // ================================================================

  /** 显示比赛结果 */
  showResults() {
    if (this._resultsOverlay) return;

    const overlay = document.createElement('div');
    overlay.id = 'results-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: rgba(8, 8, 20, 0.9);
      z-index: 70;
      font-family: 'Courier New', 'Consolas', monospace;
      color: #ffffff;
    `;

    const title = document.createElement('div');
    title.textContent = 'RACE COMPLETE';
    title.style.cssText = `
      font-size: clamp(32px, 5vw, 56px);
      font-weight: 900;
      letter-spacing: 6px;
      color: #00ff88;
      text-shadow: 0 0 30px #00ff8866;
      margin-bottom: 40px;
    `;

    const hint = document.createElement('div');
    hint.textContent = 'Press any key to return to menu';
    hint.style.cssText = `
      font-size: 14px;
      letter-spacing: 2px;
      color: #888;
      margin-top: 20px;
    `;

    overlay.appendChild(title);
    overlay.appendChild(hint);
    this.container.appendChild(overlay);
    this._resultsOverlay = overlay;
  }

  /** 隐藏比赛结果 */
  hideResults() {
    if (this._resultsOverlay) {
      this._resultsOverlay.remove();
      this._resultsOverlay = null;
    }
  }

  // ================================================================
  // HUD
  // ================================================================

  /**
   * 更新 HUD 数据
   * @param {Object} data
   * @param {number} data.speed
   * @param {number} data.lap
   * @param {number} data.totalLaps
   * @param {number} data.elapsedTime
   * @param {boolean} data.isDrifting
   * @param {boolean} [data.isRacing]
   */
  updateHUD(data) {
    this.hud.mount();
    this.hud.update(data);
  }

  /** 隐藏并卸载 HUD */
  hideHUD() {
    this.hud.unmount();
  }
}
