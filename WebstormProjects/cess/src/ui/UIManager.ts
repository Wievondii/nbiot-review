/**
 * UI管理器
 * 协调所有UI组件，管理游戏状态切换
 */
import { IUIManager, IGame, GameState, SoundIds, IAudioManager } from '../types';
import { HUD } from './HUD';
import { MainMenu } from './MainMenu';
import { PauseMenu } from './PauseMenu';
import { GameOver } from './GameOver';
// 使用Vite的资源导入方式，让Vite自动处理CSS打包
import './styles.css';

export class UIManager implements IUIManager {
  /** UI容器 */
  private container!: HTMLElement;

  /** UI组件 */
  private hud!: HUD;
  private mainMenu!: MainMenu;
  private pauseMenu!: PauseMenu;
  private gameOver!: GameOver;

  /** 消息弹窗 */
  private messagePopup!: HTMLElement;

  /** 波次公告 */
  private waveAnnounce!: HTMLElement;

  /** 音频管理器引用 */
  private audioManager: IAudioManager | null = null;

  /** 游戏实例引用 */
  private game: IGame | null = null;

  /** 消息定时器 */
  private messageTimer: number | null = null;

  /** 波次公告定时器 */
  private waveTimer: number | null = null;

  /**
   * 初始化UI系统
   * @param game 游戏实例
   */
  init(game: IGame): void {
    this.game = game;

    // 创建UI容器
    this.container = document.createElement('div');
    this.container.id = 'game-ui';
    document.body.appendChild(this.container);

    // CSS已通过import导入，Vite会自动处理打包

    // 创建UI组件
    this.hud = new HUD(this.container);
    this.mainMenu = new MainMenu(this.container);
    this.pauseMenu = new PauseMenu(this.container);
    this.gameOver = new GameOver(this.container);

    // 创建消息弹窗
    this.createMessagePopup();

    // 绑定回调
    this.bindCallbacks();

    // 监听音效事件
    this.setupSoundEvents();

    console.log('[UI] UI系统初始化完成');
  }

  /**
   * 创建消息弹窗
   */
  private createMessagePopup(): void {
    this.messagePopup = document.createElement('div');
    this.messagePopup.className = 'message-popup';
    this.container.appendChild(this.messagePopup);

    this.waveAnnounce = document.createElement('div');
    this.waveAnnounce.className = 'wave-announce';
    this.container.appendChild(this.waveAnnounce);
  }

  /**
   * 绑定回调函数
   */
  private bindCallbacks(): void {
    // 主菜单回调
    this.mainMenu.setOnStartGame(() => {
      this.game?.start();
    });

    this.mainMenu.setOnSettings(() => {
      // TODO: 显示设置面板
      console.log('[UI] 设置功能待实现');
    });

    this.mainMenu.setOnQuit(() => {
      // 退出游戏（实际只是刷新页面或显示确认）
      if (confirm('确定要退出游戏吗？')) {
        window.close();
      }
    });

    // 暂停菜单回调
    this.pauseMenu.setOnResume(() => {
      this.game?.resume();
    });

    this.pauseMenu.setOnRestart(() => {
      this.game?.restart();
    });

    this.pauseMenu.setOnSettings(() => {
      // TODO: 显示设置面板
      console.log('[UI] 设置功能待实现');
    });

    this.pauseMenu.setOnQuit(() => {
      this.game?.restart(); // 回到主菜单
    });

    // 游戏结束回调
    this.gameOver.setOnRestart(() => {
      this.game?.restart();
    });

    this.gameOver.setOnQuit(() => {
      this.game?.restart(); // 回到主菜单
    });
  }

  /**
   * 设置音效事件监听
   */
  private setupSoundEvents(): void {
    window.addEventListener('play-sound', ((e: CustomEvent) => {
      this.audioManager?.playSound(e.detail);
    }) as EventListener);
  }

  /**
   * 设置音频管理器
   * @param audioManager 音频管理器实例
   */
  setAudioManager(audioManager: IAudioManager): void {
    this.audioManager = audioManager;
  }

  /**
   * 显示主菜单
   */
  showMenu(): void {
    this.mainMenu.show();
    this.mainMenu.updateHighScore(this.game?.scoreManager.highScore ?? 0);

    // 播放菜单音乐
    this.audioManager?.playMusic(SoundIds.MUSIC_MENU);
  }

  /**
   * 隐藏主菜单
   */
  hideMenu(): void {
    this.mainMenu.hide();
    this.audioManager?.stopMusic();
  }

  /**
   * 显示HUD
   */
  showHUD(): void {
    this.hud.show();
  }

  /**
   * 隐藏HUD
   */
  hideHUD(): void {
    this.hud.hide();
  }

  /**
   * 显示暂停菜单
   */
  showPauseMenu(): void {
    this.pauseMenu.show();
  }

  /**
   * 隐藏暂停菜单
   */
  hidePauseMenu(): void {
    this.pauseMenu.hide();
  }

  /**
   * 显示游戏结束界面
   * @param score 最终分数
   * @param highScore 最高分
   */
  showGameOver(score: number, highScore: number): void {
    this.gameOver.show(score, highScore);
    this.audioManager?.stopMusic();
    this.audioManager?.playSound(SoundIds.GAME_OVER);
  }

  /**
   * 隐藏游戏结束界面
   */
  hideGameOver(): void {
    this.gameOver.hide();
  }

  /**
   * 更新HUD显示
   * @param health 生命值
   * @param ammo 当前弹药
   * @param maxAmmo 最大弹药
   * @param score 分数
   */
  updateHUD(health: number, ammo: number, maxAmmo: number, score: number): void {
    // 从游戏实例获取最大生命值，避免硬编码
    const maxHealth = this.game?.player.maxHealth ?? 100;
    this.hud.updateHealth(health, maxHealth);
    this.hud.updateAmmo(ammo, maxAmmo);
    this.hud.updateScore(score);
  }

  /**
   * 更新波次信息
   * @param wave 波次编号
   * @param zombiesRemaining 剩余僵尸数
   */
  updateWaveInfo(wave: number, zombiesRemaining: number): void {
    this.hud.updateWave(wave, zombiesRemaining);
  }

  /**
   * 显示消息
   * @param message 消息内容
   * @param duration 显示时长（毫秒），默认2000
   */
  showMessage(message: string, duration: number = 2000): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }

    this.messagePopup.textContent = message;
    this.messagePopup.classList.add('active');

    this.messageTimer = window.setTimeout(() => {
      this.messagePopup.classList.remove('active');
      this.messageTimer = null;
    }, duration);
  }

  /**
   * 显示波次公告
   * @param waveNumber 波次编号
   */
  showWaveAnnounce(waveNumber: number): void {
    if (this.waveTimer) {
      clearTimeout(this.waveTimer);
    }

    this.waveAnnounce.textContent = `WAVE ${waveNumber}`;
    this.waveAnnounce.classList.remove('active');
    void this.waveAnnounce.offsetWidth; // 触发重绘
    this.waveAnnounce.classList.add('active');

    this.audioManager?.playSound(SoundIds.WAVE_START);

    this.waveTimer = window.setTimeout(() => {
      this.waveAnnounce.classList.remove('active');
      this.waveTimer = null;
    }, 2000);
  }

  /**
   * 显示连杀提示
   * @param combo 连杀数
   */
  showCombo(combo: number): void {
    this.hud.showCombo(combo);
  }

  /**
   * 根据游戏状态更新UI
   * @param state 游戏状态
   */
  updateGameState(state: GameState): void {
    switch (state) {
      case 'menu':
        this.hideHUD();
        this.hidePauseMenu();
        this.hideGameOver();
        this.showMenu();
        break;

      case 'playing':
        this.hideMenu();
        this.hidePauseMenu();
        this.hideGameOver();
        this.showHUD();
        // 播放游戏音乐
        this.audioManager?.playMusic(SoundIds.MUSIC_GAME);
        break;

      case 'paused':
        this.showPauseMenu();
        break;

      case 'gameOver':
        this.hideHUD();
        this.showGameOver(
          this.game?.scoreManager.score ?? 0,
          this.game?.scoreManager.highScore ?? 0
        );
        break;
    }
  }

  /**
   * 释放资源
   */
  dispose(): void {
    if (this.messageTimer) {
      clearTimeout(this.messageTimer);
    }
    if (this.waveTimer) {
      clearTimeout(this.waveTimer);
    }

    this.hud.dispose();
    this.mainMenu.dispose();
    this.pauseMenu.dispose();
    this.gameOver.dispose();
    this.container.remove();
  }
}
