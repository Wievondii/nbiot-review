/**
 * 游戏引擎
 * 整合渲染、物理、场景、输入、游戏循环
 * 集成 Dev-2（WaveManager、InputManager、GameStateMachine）
 * 集成 Dev-3（ScoreManager、AudioManager、UIManager）
 */
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { IGameEngine } from '../types/engine';
import { GameState } from '../types/game';
import { Renderer } from './Renderer';
import { PhysicsWorld } from './PhysicsWorld';
import { SceneManager } from './SceneManager';
import { Raycaster } from './Raycaster';
import { Player } from '../entities/player';
import { Weapon, WeaponType } from '../entities/weapon';
import { Level1 } from '../levels/Level1';

// Dev-2 模块
import { WaveManager } from '../systems/wave';
import { InputManager } from '../systems/input';
import { GameStateMachine } from '../systems/gameStateMachine';

// Dev-3 模块
import { ScoreManager } from '../systems/score';
import { AudioManager } from '../systems/audio';
import { UIManager } from '../ui/UIManager';

export class GameEngine implements IGameEngine {
  // ==================== 核心系统 ====================
  private renderer!: Renderer;
  private physicsWorld!: PhysicsWorld;
  private sceneManager!: SceneManager;
  private raycaster!: Raycaster;

  // ==================== Dev-2 系统 ====================
  private waveManager!: WaveManager;
  private inputManager!: InputManager;
  private gameStateMachine!: GameStateMachine;

  // ==================== Dev-3 系统 ====================
  private scoreManager!: ScoreManager;
  private audioManager!: AudioManager;
  private uiManager!: UIManager;

  // ==================== 游戏实体 ====================
  private player!: Player;
  private weapons: Map<WeaponType, Weapon> = new Map();
  private currentWeaponType: WeaponType = WeaponType.PISTOL;

  // ==================== 场景 ====================
  private level!: Level1;

  // ==================== 时间 ====================
  private clock: THREE.Clock = new THREE.Clock();
  private animationFrameId: number = 0;

  // ==================== 僵尸物理体映射 ====================
  private zombieBodyMap: Map<CANNON.Body, string> = new Map();

  // ==================== DOM 元素 ====================
  private canvas!: HTMLCanvasElement;

  /** 初始化游戏引擎 */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    // 初始化核心系统
    this.renderer = new Renderer(canvas);
    this.physicsWorld = new PhysicsWorld();
    this.sceneManager = new SceneManager();
    this.raycaster = new Raycaster(this.physicsWorld);

    // 构建关卡
    this.level = new Level1(this.sceneManager, this.physicsWorld);
    this.level.build();

    // 创建玩家
    this.player = new Player(
      this.sceneManager.getCamera(),
      this.physicsWorld,
      this.sceneManager
    );

    // 预创建三把武器（修复警告：避免每次切换都创建新实例）
    this.weapons.set(WeaponType.PISTOL, new Weapon(WeaponType.PISTOL, this.raycaster));
    this.weapons.set(WeaponType.SHOTGUN, new Weapon(WeaponType.SHOTGUN, this.raycaster));
    this.weapons.set(WeaponType.RIFLE, new Weapon(WeaponType.RIFLE, this.raycaster));

    // 初始化 Dev-2 系统
    this.inputManager = new InputManager(canvas);
    this.gameStateMachine = new GameStateMachine();
    this.waveManager = new WaveManager(
      this.sceneManager.getScene(),
      this.physicsWorld,
      new THREE.Vector3(0, 0, 0)
    );

    // 初始化 Dev-3 系统
    this.scoreManager = new ScoreManager();
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager();

    // 初始化音频系统（需要用户交互后才能创建 AudioContext）
    await this.audioManager.init();

    // 初始化 UI 系统（传入游戏状态提供者）
    const gameProvider = {
      state: this.gameStateMachine.getState(),
      player: this.player,
      waveManager: this.waveManager,
      scoreManager: this.scoreManager,
      start: () => this.start(),
      pause: () => this.pause(),
      resume: () => this.resume(),
      restart: () => this.restart(),
    };
    this.uiManager.init(gameProvider as any);
    this.uiManager.setAudioManager(this.audioManager);

    // 设置波次完成回调
    this.waveManager.onWaveComplete = () => {
      this.onWaveComplete();
    };

    // 设置僵尸创建回调（用于注册物理体映射）
    this.waveManager.onZombieCreated = (zombieId: string, body: CANNON.Body) => {
      this.registerZombieBody(zombieId, body);
    };

    // 设置游戏状态回调
    this.setupGameStateCallbacks();

    // 绑定事件
    this.bindEvents();

    // 显示主菜单
    this.gameStateMachine.setState('menu');

    // 开始游戏循环
    this.clock.start();
    this.gameLoop();

    console.log('[GameEngine] 初始化完成');
  }

  /** 设置游戏状态回调 */
  private setupGameStateCallbacks(): void {
    // 进入菜单状态
    this.gameStateMachine.onStateEnter('menu', () => {
      this.uiManager.updateGameState('menu');
    });

    // 进入游戏状态
    this.gameStateMachine.onStateEnter('playing', () => {
      this.uiManager.updateGameState('playing');
      this.inputManager.lockPointer();
    });

    // 进入暂停状态
    this.gameStateMachine.onStateEnter('paused', () => {
      this.uiManager.updateGameState('paused');
      this.inputManager.unlockPointer();
    });

    // 进入游戏结束状态
    this.gameStateMachine.onStateEnter('gameOver', () => {
      this.uiManager.updateGameState('gameOver');
      this.inputManager.unlockPointer();
      this.scoreManager.saveHighScore();
    });
  }

  /** 绑定事件 */
  private bindEvents(): void {
    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.sceneManager.onWindowResize();
    });

    // 点击画布锁定指针
    this.canvas.addEventListener('click', () => {
      if (this.gameStateMachine.isPlaying() && !this.inputManager.isPointerLocked()) {
        this.inputManager.lockPointer();
      }
    });
  }

  /** 开始游戏 */
  start(): void {
    this.scoreManager.resetScore();
    this.player.reset();

    // 重置所有武器
    this.weapons.forEach((weapon) => { weapon.reset(); });
    this.currentWeaponType = WeaponType.PISTOL;

    // 重置波次管理器
    this.waveManager.reset();

    // 切换到游戏状态
    this.gameStateMachine.startGame();

    // 开始第一波
    this.waveManager.startWave();
  }

  /** 暂停游戏 */
  pause(): void {
    if (this.gameStateMachine.isPlaying()) {
      this.gameStateMachine.pauseGame();
    }
  }

  /** 继续游戏 */
  resume(): void {
    if (this.gameStateMachine.isPaused()) {
      this.gameStateMachine.resumeGame();
      this.inputManager.lockPointer();
    }
  }

  /** 重新开始 */
  restart(): void {
    this.start();
  }

  // ==================== 游戏逻辑 ====================

  /** 射击 */
  private shoot(): void {
    const weapon = this.getCurrentWeapon();
    const results = weapon.fireWithRaycast(this.sceneManager.getCamera());

    if (results.length > 0) {
      // 播放射击音效
      this.playWeaponSound(weapon.type);

      // 处理命中
      results.forEach((result) => {
        if (result.hit && result.body) {
          const zombieId = this.zombieBodyMap.get(result.body);
          if (zombieId) {
            this.onZombieHit(zombieId, weapon.damage);
          }
        }
      });
    }
  }

  /** 播放武器音效 */
  private playWeaponSound(type: WeaponType): void {
    switch (type) {
      case WeaponType.PISTOL:
        this.audioManager.playSound('pistol_fire');
        break;
      case WeaponType.SHOTGUN:
        this.audioManager.playSound('shotgun_fire');
        break;
      case WeaponType.RIFLE:
        this.audioManager.playSound('rifle_fire');
        break;
    }
  }

  /** 僵尸被击中处理（修复 BLOCKER：射击命中僵尸无效） */
  private onZombieHit(zombieId: string, damage: number): void {
    // 通过 WaveManager 处理伤害
    const killed = this.waveManager.damageZombie(zombieId, damage);

    // 播放命中音效
    this.audioManager.playSound('zombie_hit');

    if (killed) {
      // 僵尸被击杀
      this.onZombieKilled();
    }
  }

  /** 僵尸被击杀 */
  private onZombieKilled(): void {
    // 通过 ScoreManager 添加分数（使用连杀系统）
    this.scoreManager.addKillScore(false);

    // 播放击杀音效
    this.audioManager.playSound('zombie_death');

    // 更新 UI 连杀提示
    const combo = this.scoreManager.getComboCount();
    if (combo >= 3) {
      this.uiManager.showCombo(combo);
    }

    console.log(`[GameEngine] 僵尸被击杀！当前得分: ${this.scoreManager.score}`);
  }

  /** 波次完成 */
  private onWaveComplete(): void {
    // 添加波次奖励
    this.scoreManager.addWaveBonus(this.waveManager.currentWave);

    // 播放波次完成音效
    this.audioManager.playSound('wave_complete');

    // 显示波次公告
    this.uiManager.showWaveAnnounce(this.waveManager.currentWave + 1);

    // 显示消息
    this.uiManager.showMessage(`波次 ${this.waveManager.currentWave} 完成！`);

    console.log(`[GameEngine] 波次 ${this.waveManager.currentWave} 完成！`);
  }

  /** 切换武器（修复警告：预创建武器，切换时只切换引用） */
  private switchWeapon(type: WeaponType): void {
    if (this.currentWeaponType === type) return;
    this.currentWeaponType = type;
    this.updateHUD();
  }

  /** 获取当前武器 */
  private getCurrentWeapon(): Weapon {
    return this.weapons.get(this.currentWeaponType)!;
  }

  /** 注册僵尸物理体（供 Dev-2 调用） */
  registerZombieBody(zombieId: string, body: CANNON.Body): void {
    this.zombieBodyMap.set(body, zombieId);
  }

  /** 注销僵尸物理体 */
  unregisterZombieBody(body: CANNON.Body): void {
    this.zombieBodyMap.delete(body);
  }

  // ==================== HUD 更新 ====================

  private updateHUD(): void {
    const weapon = this.getCurrentWeapon();

    // 通过 UIManager 更新 HUD
    this.uiManager.updateHUD(
      this.player.health,
      weapon.ammo,
      weapon.maxAmmo,
      this.scoreManager.score
    );

    // 更新波次信息
    this.uiManager.updateWaveInfo(
      this.waveManager.currentWave,
      this.waveManager.zombiesRemaining
    );
  }

  // ==================== 游戏循环 ====================

  /** 主游戏循环 */
  private gameLoop(): void {
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));

    const deltaTime = Math.min(this.clock.getDelta(), 0.05);

    // 更新输入管理器
    this.inputManager.update();

    // 处理暂停输入
    if (this.inputManager.isPausePressed()) {
      if (this.gameStateMachine.isPlaying()) {
        this.pause();
      } else if (this.gameStateMachine.isPaused()) {
        this.resume();
      }
    }

    // 只在游戏状态时更新游戏逻辑
    if (this.gameStateMachine.isPlaying()) {
      this.update(deltaTime);
    }

    // 始终渲染
    this.renderer.render(
      this.sceneManager.getScene(),
      this.sceneManager.getCamera()
    );
  }

  /** 每帧更新 */
  update(deltaTime: number): void {
    // 处理鼠标移动（通过 InputManager）
    const mouseMovement = this.inputManager.getRawMouseMovement();
    if (mouseMovement.x !== 0 || mouseMovement.y !== 0) {
      this.player.rotate(mouseMovement.x, mouseMovement.y);
    }

    // 处理移动输入（通过 InputManager）
    this.processMovementInput();

    // 处理射击输入
    if (this.inputManager.isFirePressed() && this.inputManager.isPointerLocked()) {
      this.shoot();
    }

    // 处理换弹输入
    if (this.inputManager.isReloadPressed()) {
      this.getCurrentWeapon().reload();
    }

    // 处理武器切换
    if (this.inputManager.getKeyState('Digit1')) this.switchWeapon(WeaponType.PISTOL);
    if (this.inputManager.getKeyState('Digit2')) this.switchWeapon(WeaponType.SHOTGUN);
    if (this.inputManager.getKeyState('Digit3')) this.switchWeapon(WeaponType.RIFLE);

    // 更新物理
    this.physicsWorld.step(deltaTime);

    // 更新玩家
    this.player.update(deltaTime);

    // 更新武器
    this.weapons.forEach((weapon) => { weapon.update(deltaTime); });

    // 更新波次管理器（包含僵尸更新）
    this.waveManager.update(deltaTime, this.player.position);

    // 更新得分系统（连杀计时器）
    this.scoreManager.updateCombo();

    // 更新 HUD
    this.updateHUD();

    // 检查玩家死亡
    if (!this.player.isAlive()) {
      this.gameStateMachine.gameOver();
    }
  }

  /** 处理移动输入（通过 InputManager） */
  private processMovementInput(): void {
    const moveDir = new THREE.Vector3(0, 0, 0);
    const forward = this.player.getForwardDirection();
    const right = this.player.getRightDirection();

    const movement = this.inputManager.getMovementInput();
    if (movement.forward) moveDir.add(forward);
    if (movement.backward) moveDir.sub(forward);
    if (movement.left) moveDir.sub(right);
    if (movement.right) moveDir.add(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.player.move(moveDir, 5);
    }

    // 冲刺
    this.player.setSprinting(
      this.inputManager.getKeyState('ShiftLeft') ||
      this.inputManager.getKeyState('ShiftRight')
    );

    // 跳跃
    if (this.inputManager.isJumpPressed()) {
      this.player.jump();
    }
  }

  // ==================== Getters（供其他模块访问） ====================

  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  getPhysicsWorld(): PhysicsWorld {
    return this.physicsWorld;
  }

  getPlayer(): Player {
    return this.player;
  }

  getWeapon(): Weapon {
    return this.getCurrentWeapon();
  }

  getRaycaster(): Raycaster {
    return this.raycaster;
  }

  getGameState(): GameState {
    return this.gameStateMachine.getState();
  }

  getWave(): number {
    return this.waveManager.currentWave;
  }

  getScore(): number {
    return this.scoreManager.score;
  }

  getWaveManager(): WaveManager {
    return this.waveManager;
  }

  getInputManager(): InputManager {
    return this.inputManager;
  }

  getGameStateMachine(): GameStateMachine {
    return this.gameStateMachine;
  }

  getScoreManager(): ScoreManager {
    return this.scoreManager;
  }

  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  getUIManager(): UIManager {
    return this.uiManager;
  }

  /** 释放资源 */
  dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    this.player.dispose();
    this.waveManager.dispose();
    this.inputManager.dispose();
    this.gameStateMachine.dispose();
    this.scoreManager.saveHighScore();
    this.audioManager.dispose();
    this.uiManager.dispose();
    this.physicsWorld.dispose();
    this.sceneManager.dispose();
    this.renderer.dispose();
  }
}
