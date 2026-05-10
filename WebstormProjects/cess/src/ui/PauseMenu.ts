/**
 * 暂停菜单组件
 * 显示继续、重新开始、设置、退出按钮
 */
import { MenuCallback } from './MainMenu';

export class PauseMenu {
  private container: HTMLElement;
  private overlay!: HTMLElement;

  /** 回调函数 */
  private onResume: MenuCallback | null = null;
  private onRestart: MenuCallback | null = null;
  private onSettings: MenuCallback | null = null;
  private onQuit: MenuCallback | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'pause-menu';
    parent.appendChild(this.container);

    this.createMenu();
  }

  /**
   * 创建暂停菜单
   */
  private createMenu(): void {
    this.container.innerHTML = `
      <div class="menu-overlay" id="pause-menu-overlay">
        <div class="menu-container">
          <div class="menu-title">暂停</div>
          
          <div class="menu-buttons">
            <button class="menu-btn primary" id="btn-resume">继续游戏</button>
            <button class="menu-btn" id="btn-restart">重新开始</button>
            <button class="menu-btn" id="btn-pause-settings">设置</button>
            <button class="menu-btn" id="btn-pause-quit">退出到主菜单</button>
          </div>
        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('#pause-menu-overlay')!;

    // 绑定按钮事件
    this.bindEvents();
  }

  /**
   * 绑定按钮事件
   */
  private bindEvents(): void {
    const resumeBtn = this.container.querySelector('#btn-resume')!;
    const restartBtn = this.container.querySelector('#btn-restart')!;
    const settingsBtn = this.container.querySelector('#btn-pause-settings')!;
    const quitBtn = this.container.querySelector('#btn-pause-quit')!;

    resumeBtn.addEventListener('click', () => {
      this.playClickSound();
      this.onResume?.();
    });

    restartBtn.addEventListener('click', () => {
      this.playClickSound();
      this.onRestart?.();
    });

    settingsBtn.addEventListener('click', () => {
      this.playClickSound();
      this.onSettings?.();
    });

    quitBtn.addEventListener('click', () => {
      this.playClickSound();
      this.onQuit?.();
    });

    // 按钮悬停音效
    [resumeBtn, restartBtn, settingsBtn, quitBtn].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        this.playHoverSound();
      });
    });
  }

  /**
   * 播放点击音效
   */
  private playClickSound(): void {
    window.dispatchEvent(new CustomEvent('play-sound', { detail: 'menu_click' }));
  }

  /**
   * 播放悬停音效
   */
  private playHoverSound(): void {
    window.dispatchEvent(new CustomEvent('play-sound', { detail: 'menu_hover' }));
  }

  /**
   * 显示暂停菜单
   */
  show(): void {
    this.overlay.classList.add('active');
  }

  /**
   * 隐藏暂停菜单
   */
  hide(): void {
    this.overlay.classList.remove('active');
  }

  /**
   * 设置继续游戏回调
   */
  setOnResume(callback: MenuCallback): void {
    this.onResume = callback;
  }

  /**
   * 设置重新开始回调
   */
  setOnRestart(callback: MenuCallback): void {
    this.onRestart = callback;
  }

  /**
   * 设置设置按钮回调
   */
  setOnSettings(callback: MenuCallback): void {
    this.onSettings = callback;
  }

  /**
   * 设置退出回调
   */
  setOnQuit(callback: MenuCallback): void {
    this.onQuit = callback;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.container.remove();
  }
}
