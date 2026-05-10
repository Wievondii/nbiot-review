/**
 * 游戏结束界面组件
 * 显示最终分数、高分、重新开始和退出按钮
 */
import { MenuCallback } from './MainMenu';

export class GameOver {
  private container: HTMLElement;
  private overlay!: HTMLElement;
  private finalScoreValue!: HTMLElement;
  private highScoreValue!: HTMLElement;
  private newHighScoreLabel!: HTMLElement;

  /** 回调函数 */
  private onRestart: MenuCallback | null = null;
  private onQuit: MenuCallback | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'game-over';
    parent.appendChild(this.container);

    this.createMenu();
  }

  /**
   * 创建游戏结束界面
   */
  private createMenu(): void {
    this.container.innerHTML = `
      <div class="menu-overlay" id="game-over-overlay">
        <div class="menu-container">
          <div class="game-over-title">游戏结束</div>
          
          <div class="final-score">
            <div class="final-score-label">最终得分</div>
            <div class="final-score-value" id="final-score">0</div>
          </div>

          <div class="new-high-score" id="new-high-score" style="display: none;">
            新纪录！
          </div>

          <div class="high-score-display">
            <div class="high-score-label">最高分</div>
            <div class="high-score-value" id="game-over-high-score">0</div>
          </div>
          
          <div class="menu-buttons" style="margin-top: 24px;">
            <button class="menu-btn primary" id="btn-restart-game">重新开始</button>
            <button class="menu-btn" id="btn-exit-menu">退出到主菜单</button>
          </div>
        </div>
      </div>
    `;

    this.overlay = this.container.querySelector('#game-over-overlay')!;
    this.finalScoreValue = this.container.querySelector('#final-score')!;
    this.highScoreValue = this.container.querySelector('#game-over-high-score')!;
    this.newHighScoreLabel = this.container.querySelector('#new-high-score')!;

    // 绑定按钮事件
    this.bindEvents();
  }

  /**
   * 绑定按钮事件
   */
  private bindEvents(): void {
    const restartBtn = this.container.querySelector('#btn-restart-game')!;
    const quitBtn = this.container.querySelector('#btn-exit-menu')!;

    restartBtn.addEventListener('click', () => {
      this.playClickSound();
      this.onRestart?.();
    });

    quitBtn.addEventListener('click', () => {
      this.playClickSound();
      this.onQuit?.();
    });

    // 按钮悬停音效
    [restartBtn, quitBtn].forEach(btn => {
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
   * 显示游戏结束界面
   * @param score 最终分数
   * @param highScore 最高分
   */
  show(score: number, highScore: number): void {
    this.finalScoreValue.textContent = score.toLocaleString();
    this.highScoreValue.textContent = highScore.toLocaleString();

    // 检查是否创造新纪录
    if (score >= highScore && score > 0) {
      this.newHighScoreLabel.style.display = 'block';
    } else {
      this.newHighScoreLabel.style.display = 'none';
    }

    this.overlay.classList.add('active');
  }

  /**
   * 隐藏游戏结束界面
   */
  hide(): void {
    this.overlay.classList.remove('active');
  }

  /**
   * 设置重新开始回调
   */
  setOnRestart(callback: MenuCallback): void {
    this.onRestart = callback;
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
