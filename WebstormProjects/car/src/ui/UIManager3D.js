/**
 * @file UIManager3D — UI 管理器（3D 版本）
 *
 * 整合 HUD3D、Menu3D、Countdown3D 三个 UI 组件，
 * 对外暴露统一的 IUIManager 接口，供 GameLoop 调用。
 *
 * 接口方法：
 *   showMenu / hideMenu / getSelectedTrack
 *   showCountdown / hideCountdown
 *   showPauseMenu / hidePauseMenu
 *   showResults / hideResults
 *   showHUD / hideHUD / updateHUD
 */

import { HUD3D } from './HUD3D.js';
import { Menu3D } from './Menu3D.js';
import { Countdown3D } from './Countdown3D.js';
import {
  EVENT_COUNTDOWN_COMPLETE,
  EVENT_ACTION,
} from '../types.js';

export class UIManager3D {
  /**
   * @param {HTMLCanvasElement} canvas - Canvas 元素，用于获取父容器
   * @param {import('../types.js').IEventBus} eventBus - 事件总线
   */
  constructor(canvas, eventBus) {
    /** @type {HTMLElement} UI 挂载容器（Canvas 父元素） */
    this.container = canvas.parentElement;

    /** @type {import('../types.js').IEventBus} */
    this.eventBus = eventBus;

    /** @type {HUD3D} */
    this.hud = new HUD3D();

    /** @type {Menu3D} */
    this.menu = new Menu3D();

    /** @type {Countdown3D} */
    this.countdown = new Countdown3D();

    /** @type {HTMLElement|null} 暂停覆盖层 */
    this._pauseOverlay = null;

    /** @type {HTMLElement|null} 结果覆盖层 */
    this._resultsOverlay = null;

    /** @type {string} 当前选中的赛道 ID */
    this._selectedTrack = 'motor-speedway';

    // 初始化三个子组件（共享同一容器）
    this.hud.init(this.container);
    this.menu.init(this.container);
    this.countdown.init(this.container);
  }

  // ================================================================
  // 菜单
  // ================================================================

  /** 显示主菜单 */
  showMenu() {
    this.menu.show({
      onStart: () => {
        this.eventBus.emit(EVENT_ACTION, 'start');
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
   * 显示倒计时（3→2→1→GO!）
   * 完成后通过 EventBus 通知 GameLoop
   * @param {number} _value - 初始值（未使用，Countdown3D 内部管理）
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
  // 暂停菜单
  // ================================================================

  /** 显示暂停菜单（DOM 覆盖层） */
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
   * 显示 HUD
   */
  showHUD() {
    this.hud.show();
  }

  /**
   * 更新 HUD 数据（每帧调用）
   * @param {import('../types.js').HUDData} data
   */
  updateHUD(data) {
    this.hud.show();
    this.hud.update(data);
  }

  /** 隐藏并卸载 HUD */
  hideHUD() {
    this.hud.hide();
  }
}
