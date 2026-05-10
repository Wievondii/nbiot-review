/**
 * 主菜单组件
 * 显示游戏标题、开始游戏、设置、退出按钮
 */

export type MenuCallback = () => void;

export class MainMenu {
  private container: HTMLElement;
  private overlay!: HTMLElement;
  private highScoreValue!: HTMLElement;

  /** 回调函数 */
  private onStartGame: MenuCallback | null = null;
  private onSettings: MenuCallback | null = null;
  private onQuit: MenuCallback | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'main-menu';
    parent.appendChild(this.container);

    this.createMenu();
  }

  /**
   * 创建主菜单
   */
  private createMenu(): void {
    this.container.innerHTML = `
      <div class="menu-overlay" id="main-menu-overlay">
        <div class="menu-container">
          <div class="game-logo">ZOMBIE<br>FPS</div>
          <div class="game-tagline">在末日中生存</div>
          
          <div class="menu-buttons">
            <button class="menu-btn primary" id="btn-start-game">开始游戏</button>
            <button class="menu-btn" id="btn-settings">设置</button>
            <button class="menu-btn" id="btn-quit">退出</button>
          </div>

          <div class="high-score-display">
            <div class="high-score-label">最高分</div>
            <div class="high-score-value" id="main-high-score">0</div>
          </div>
        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('#main-menu-overlay')!;
    this.highScoreValue = this.container.querySelector('#main-high-score')!;

    // 绑定按钮事件
    this.bindEvents();
  }

  /**
   * 绑定按钮事件
   */
  private bindEvents(): void {
    const startBtn = this.container.querySelector('#btn-start-game')!;
    const settingsBtn = this.container.querySelector('#btn-settings')!;
    const quitBtn = this.container.querySelector('#btn-quit')!;

    startBtn.addEventListener('click', () => {
      this.playClickSound();
      this.onStartGame?.();
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
    [startBtn, settingsBtn, quitBtn].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        this.playHoverSound();
      });
    });
  }

  /**
   * 播放点击音效（通过自定义事件）
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
   * 显示主菜单
   */
  show(): void {
    this.overlay.classList.add('active');
  }

  /**
   * 隐藏主菜单
   */
  hide(): void {
    this.overlay.classList.remove('active');
  }

  /**
   * 更新高分显示
   * @param score 高分值
   */
  updateHighScore(score: number): void {
    this.highScoreValue.textContent = score.toLocaleString();
  }

  /**
   * 设置开始游戏回调
   */
  setOnStartGame(callback: MenuCallback): void {
    this.onStartGame = callback;
  }

  /**
   * 设置设置按钮回调
   */
  setOnSettings(callback: MenuCallback): void {
    this.onSettings = callback;
  }

  /**
   * 设置退出按钮回调
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
