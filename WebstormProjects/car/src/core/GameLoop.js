/**
 * @file 固定步长游戏主循环
 *
 * 使用 accumulator 模式实现固定时间步长的物理更新，
 * 渲染使用可变时间步长（跟随显示器刷新率）。
 *
 * 物理更新:
 *   PhysicsEngine.update(dt, inputState)  — PhysicsEngine 内部管理 accumulator
 *   raw frameTime 直接传入，由 PhysicsEngine 做固定步长转换
 *
 * 渲染:
 *   每帧调用 render.render(cars, track, state)
 *
 * 调用关系（接口调用关系表）:
 *   - physics.update(dt, inputState)       每物理帧 (PhysicsEngine 内部管理 accumulator)
 *   - physics.checkCollisions()            物理更新后检测碰撞并发射事件
 *   - render.render(cars, track, state)    每渲染帧
 *   - audio.playEngine(speed)              每渲染帧
 *   - track.loadTrack(name)                init 时
 *   - ui.updateHUD(data)                   每渲染帧
 */

import {
  MAX_FRAME_TIME,
  STATE_MENU,
  STATE_COUNTDOWN,
  STATE_RACING,
  STATE_PAUSED,
  STATE_FINISHED,
  EVENT_COLLISION,
  EVENT_COUNTDOWN_COMPLETE,
  EVENT_CHECKPOINT_PASSED,
  EVENT_LAP_COMPLETE,
  EVENT_RACE_COMPLETE,
  EVENT_DRIFT_START,
  EVENT_DRIFT_END,
} from '../types.js';

export class GameLoop {
  /**
   * @param {Object} deps - 依赖注入
   * @param {import('../types.js').IPhysicsEngine} deps.physicsEngine
   * @param {import('../types.js').IRenderEngine} deps.renderEngine
   * @param {import('../types.js').IInputController} deps.inputController
   * @param {import('../types.js').IAudioManager} deps.audioManager
   * @param {import('../types.js').ITrackManager} deps.trackManager
   * @param {import('../types.js').IUIManager} deps.uiManager
   * @param {import('../types.js').IEventBus} deps.eventBus
   * @param {import('../types.js').IGameState} deps.gameState
   * @param {import('../track/Checkpoint.js').CheckpointSystem} deps.checkpointSystem
   */
  constructor(deps) {
    this.physics = deps.physicsEngine;
    this.render = deps.renderEngine;
    this.input = deps.inputController;
    this.audio = deps.audioManager;
    this.track = deps.trackManager;
    this.ui = deps.uiManager;
    this.eventBus = deps.eventBus;
    this.state = deps.gameState;
    this.checkpoints = deps.checkpointSystem;

    /** @type {boolean} 循环是否运行中 */
    this._running = false;

    /** @type {number} 上一帧时间戳（秒） */
    this._lastTime = 0;

    /** @type {number|null} requestAnimationFrame ID */
    this._rafId = null;

    /** @type {number} 比赛已用时（秒） */
    this._elapsedTime = 0;

    /**
     * 上一帧赛车位置缓存（用于检查点线段相交检测）
     * @type {Object<string, {x:number, y:number}>}
     */
    this._prevCarPos = {};

    /** @type {boolean} 上一帧的漂移状态（用于检测变化） */
    this._prevDrifting = false;
  }

  /**
   * 初始化游戏循环。
   * 注册状态回调、加载赛道、设置初始状态。
   * 必须在 start() 之前调用。
   */
  init() {
    // ================================================================
    // 【关键】必须先注册所有 onEnter/onExit/onStateChange 回调，
    // 再调用 setState()，确保初始状态的 onEnter 被正确触发。
    // ================================================================

    // --- 菜单状态 ---
    this.state.onEnter(STATE_MENU, () => {
      this.ui.showMenu();
    });
    this.state.onExit(STATE_MENU, () => {
      this.ui.hideMenu();
      // 加载赛道（支持从 UI 菜单获取赛道名，如有不匹配则回退）
      const rawName = this.ui.getSelectedTrack
        ? this.ui.getSelectedTrack()
        : 'motor-speedway';
      let trackData = this.track.loadTrack(rawName);
      if (!trackData) {
        console.warn(
          `[GameLoop] 赛道 "${rawName}" 未注册，回退至 "motor-speedway"`
        );
        trackData = this.track.loadTrack('motor-speedway');
      }
      if (trackData) {
        // 初始化物理引擎: 创建赛车、设置赛道边界
        this.physics.init(
          [
            {
              id: 'player',
              position: trackData.startPoint,
              angle: trackData.startAngle,
            },
          ],
          trackData.barriers
        );
        // 初始化检查点系统: 注册赛道和玩家赛车
        this.checkpoints.init(trackData);
        this.checkpoints.registerCar('player');
      }
    });

    // --- 倒计时状态 ---
    // 倒计时由 UI 组件 (Countdown) 内部通过 setTimeout / CSS 动画驱动，
    // 完成后通过 EVENT_COUNTDOWN_COMPLETE 通知 GameLoop
    this.state.onEnter(STATE_COUNTDOWN, () => {
      this.ui.showCountdown(3);
      this.audio.playCountdown();
      // 重置上一帧位置缓存
      this._prevCarPos = {};
    });
    this.state.onExit(STATE_COUNTDOWN, () => {
      this.ui.hideCountdown();
    });

    // --- 比赛状态 ---
    this.state.onEnter(STATE_RACING, () => {
      this.audio.playMusic('racing');
      this._elapsedTime = 0;
      // 确保检查点系统已完成初始化并有玩家赛车注册
      this.checkpoints.registerCar('player');
      // 重置帧计时，防止进入 racing 时的时间突跳
      this._lastTime = performance.now() / 1000;
      // 重置上一帧位置缓存
      this._prevCarPos = {};
    });

    // --- 暂停状态 ---
    this.state.onEnter(STATE_PAUSED, () => {
      this.ui.showPauseMenu();
      this.audio.setVolume(0.3);
    });
    this.state.onExit(STATE_PAUSED, () => {
      this.ui.hidePauseMenu();
      this.audio.setVolume(1.0);
      // 恢复时重置时间，防止累积暂停期间的时间
      this._lastTime = performance.now() / 1000;
    });

    // --- 完成状态 ---
    this.state.onEnter(STATE_FINISHED, () => {
      this.ui.showResults();
      this.audio.playMusic('racing');
    });
    this.state.onExit(STATE_FINISHED, () => {
      this.ui.hideResults();
    });

    // --- 全局状态变更 ---
    this.state.onStateChange((newState, prevState) => {
      if (newState === STATE_RACING && prevState !== STATE_RACING) {
        this._lastTime = performance.now() / 1000;
      }
      // 更新摄像机视角跟随赛车
      if (newState === STATE_RACING || newState === STATE_COUNTDOWN) {
        const car = this.physics.getCarState('player');
        if (car) {
          this.render.setCamera(car.position, car.angle);
        }
      }
    });

    // ================================================================
    // 订阅事件总线事件
    // ================================================================

    // 碰撞事件 → 播放碰撞音效
    this.eventBus.on(EVENT_COLLISION, (event) => {
      this.audio.playCollision();
    });

    // 完成一圈 → 播放圈完成音效
    this.eventBus.on(EVENT_LAP_COMPLETE, (data) => {
      this.audio.playLapComplete(data.lap);
    });

    // 比赛完成 → 切换到完成状态
    this.eventBus.on(EVENT_RACE_COMPLETE, () => {
      if (this.state.is(STATE_RACING)) {
        this.state.setState(STATE_FINISHED);
      }
    });

    // 倒计时完成 → 切换到比赛状态
    this.eventBus.on(EVENT_COUNTDOWN_COMPLETE, () => {
      if (this.state.is(STATE_COUNTDOWN)) {
        this.state.setState(STATE_RACING);
      }
    });

    // 漂移状态变化 → 播放漂移音效
    this.eventBus.on(EVENT_DRIFT_START, () => {
      this.audio.playDrift();
    });

    // ================================================================
    // 连接 CheckpointSystem 回调 → EventBus
    // ================================================================

    // 通过检查点 → 广播事件（供 UI/调试使用）
    this.checkpoints.onCheckpointPassed((carId, checkpointIndex, lap) => {
      this.eventBus.emit(EVENT_CHECKPOINT_PASSED, { carId, checkpointIndex, lap });
    });

    // 完成一圈 → 广播事件 + 同步 PhysicsEngine 圈数
    this.checkpoints.onLapComplete((carId, lap) => {
      this.physics.setCarLap(carId, lap);
      this.eventBus.emit(EVENT_LAP_COMPLETE, { carId, lap });
    });

    // 比赛完成 → 广播事件
    this.checkpoints.onRaceComplete((carId) => {
      this.eventBus.emit(EVENT_RACE_COMPLETE, { carId });
    });

    // ================================================================
    // 注册输入动作回调
    // ================================================================
    this.input.onAction('pause', () => {
      if (this.state.is(STATE_RACING)) {
        this.state.setState(STATE_PAUSED);
      } else if (this.state.is(STATE_PAUSED)) {
        this.state.setState(STATE_RACING);
      }
    });

    this.input.onAction('start', () => {
      if (this.state.is(STATE_MENU)) {
        this.state.setState(STATE_COUNTDOWN);
      }
    });

    this.input.onAction('restart', () => {
      if (this.state.is(STATE_FINISHED)) {
        this.state.setState(STATE_MENU);
      }
    });

    // ================================================================
    // 【关键】注册完成后调用 setState 设置初始状态
    // 这将触发 onEnter('menu') 回调
    // ================================================================
    this.state.setState(STATE_MENU);
  }

  /**
   * 启动游戏循环。
   * 调用前必须已调用 init()。
   */
  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now() / 1000;
    this._elapsedTime = 0;
    this._rafId = requestAnimationFrame(() => this._tick());
  }

  /**
   * 暂停游戏（从 racing 切换到 paused）
   */
  pause() {
    if (this.state.is(STATE_RACING)) {
      this.state.setState(STATE_PAUSED);
    }
  }

  /**
   * 恢复游戏（从 paused 切换到 racing）
   */
  resume() {
    if (this.state.is(STATE_PAUSED)) {
      this.state.setState(STATE_RACING);
    }
  }

  /**
   * 停止游戏循环。
   */
  stop() {
    this._running = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * 每一帧的更新入口。
   */
  _tick() {
    if (!this._running) return;

    // 使用 performance.now() 确保时间单调递增
    const now = performance.now() / 1000;
    let frameTime = now - this._lastTime;
    this._lastTime = now;

    // 限制最大帧时间，防止 tab 切换后时间突跳
    frameTime = Math.min(frameTime, MAX_FRAME_TIME);

    // ================================================================
    // 物理更新（仅 racing 状态执行）
    // PhysicsEngine.update(dt, inputState) 内部管理 accumulator，
    // GameLoop 只需传入原始帧时间
    // ================================================================
    if (this.state.is(STATE_RACING)) {
      // 物理更新前记录赛车当前帧位置（作为检查点检测的"上一帧"位置）
      const carBefore = this.physics.getCarState('player');
      const prevPos = carBefore
        ? { x: carBefore.position.x, y: carBefore.position.y }
        : null;
      if (prevPos) {
        this._prevCarPos['player'] = prevPos;
      }

      // 获取输入状态并传递给物理引擎
      const inputState = this.input.getState();

      // PhysicsEngine 内部会做固定步长转换
      this.physics.update(frameTime, inputState);

      // 物理更新后检测碰撞并发射事件
      const collisions = this.physics.checkCollisions();
      for (const event of collisions) {
        this.eventBus.emit(EVENT_COLLISION, event);
      }

      // 物理更新后获取新位置，检查检查点和圈数
      const carAfter = this.physics.getCarState('player');
      if (carAfter && this._prevCarPos['player']) {
        this.checkpoints.update(
          'player',
          carAfter.position,
          this._prevCarPos['player']
        );
      }

      // 【BLOCKER #2 兼容修复】检测漂移状态变化并发射事件
      // PhysicsEngine 内部更新漂移状态但不通过 EventBus 通知，
      // 在此处由 GameLoop 检测变化并广播
      if (carAfter) {
        if (carAfter.isDrifting && !this._prevDrifting) {
          this.eventBus.emit(EVENT_DRIFT_START, { carId: 'player' });
        } else if (!carAfter.isDrifting && this._prevDrifting) {
          this.eventBus.emit(EVENT_DRIFT_END, { carId: 'player' });
        }
        this._prevDrifting = carAfter.isDrifting;
      }

      // 更新比赛用时
      this._elapsedTime += frameTime;
    }

    // ================================================================
    // 渲染（每帧都执行，根据状态显示不同内容）
    // ================================================================

    // 获取当前赛车状态和赛道数据
    // 【安全守卫】非 racing 状态下物理引擎可能尚未初始化，getCarState 可能返回 null
    const playerCar =
      this.state.is(STATE_RACING) || this.state.is(STATE_COUNTDOWN)
        ? this.physics.getCarState('player')
        : null;
    const allCars = this.physics.getAllCarStates
      ? this.physics.getAllCarStates()
      : playerCar
        ? [playerCar]
        : [];
    
    // 获取赛道数据（TrackLoader 使用 getCurrentTrack 而非 getTrackData）
    const trackData = this.track.getCurrentTrack();

    // 调用渲染引擎
    this.render.render(allCars, trackData, this.state.current);

    // ================================================================
    // 音频更新
    // ================================================================
    if (this.state.is(STATE_RACING) && playerCar) {
      this.audio.playEngine(playerCar.speed);
    }

    // ================================================================
    // HUD 更新（比赛中/暂停时显示）
    // ================================================================
    if (this.state.is(STATE_RACING) || this.state.is(STATE_PAUSED)) {
      this.ui.updateHUD({
        speed: playerCar ? playerCar.speed : 0,
        lap: this.checkpoints.getLap('player'),
        totalLaps: trackData ? trackData.lapCount : 3,
        elapsedTime: this._elapsedTime,
        isDrifting: playerCar ? playerCar.isDrifting : false,
        isRacing: this.state.is(STATE_RACING),
      });
    }

    // 调度下一帧
    this._rafId = requestAnimationFrame(() => this._tick());
  }
}
