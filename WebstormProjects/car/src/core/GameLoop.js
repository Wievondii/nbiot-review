/**
 * @file 固定步长游戏主循环（3D 版本）
 *
 * 使用 accumulator 模式实现固定时间步长的物理更新，
 * 渲染使用可变时间步长（跟随显示器刷新率）。
 *
 * 物理更新:
 *   PhysicsEngine3D.update(dt, inputState)  — GameLoop 传入原始帧时间，
 *   PhysicsEngine3D 内部管理 accumulator 做固定步长转换
 *
 * 渲染:
 *   每帧调用 RenderEngine3D.render(cars, track, state)
 *
 * 调用关系（接口调用关系表）:
 *   - physics.update(dt, inputState)         每物理帧
 *   - physics.checkCollisions()              物理更新后检测碰撞并发射事件
 *   - physics.getCarState(carId)             获取赛车 3D 状态
 *   - render.render(cars, track, state)      每渲染帧
 *   - audio.playEngine(speed)                每渲染帧
 *   - track.loadTrack(name)                  init 时
 *   - ui.updateHUD(data)                     每渲染帧
 */

import {
  MAX_FRAME_TIME,
  STATE_MENU,
  STATE_COUNTDOWN,
  STATE_RACING,
  STATE_PAUSED,
  STATE_FINISHED,
  EVENT_ACTION,
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
   * @param {import('../types.js').IPhysicsEngine3D} deps.physicsEngine
   * @param {import('../types.js').IRenderEngine3D} deps.renderEngine
   * @param {import('../types.js').IInputController} deps.inputController
   * @param {import('../types.js').IAudioManager3D} deps.audioManager
   * @param {import('../types.js').ITrackManager} deps.trackManager
   * @param {import('../types.js').IUIManager} deps.uiManager
   * @param {import('../types.js').IEventBus} deps.eventBus
   * @param {import('../types.js').IGameState} deps.gameState
   * @param {Object} deps.checkpointSystem
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
    this.camera = deps.cameraController || null;
    /** @type {import('../render/CarModel.js').CarModel|null} 赛车视觉模型 */
    this.carModel = deps.carModel || null;

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
     * @type {Object<string, {x:number, z:number}>}
     */
    this._prevCarPos = {};

    /** @type {boolean} 上一帧的漂移状态（用于检测变化） */
    this._prevDrifting = false;

    /** @type {number} 帧计数器（FPS 监控用） */
    this._frameCount = 0;

    /** @type {number} 帧时间累加器（FPS 监控用） */
    this._fpsAccumulator = 0;

    /** @type {number} 上次 FPS 日志时间戳（秒） */
    this._lastFpsLogTime = 0;
  }

  /**
   * 初始化游戏循环。
   * 注册状态回调、加载赛道、设置初始状态。
   * 必须在 start() 之前调用。
   */
  init() {
    if (window.DEBUG) console.log('[GameLoop] Initializing...');

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
        : 'motor-speedway-3d';
      let trackData = this.track.loadTrack(rawName);
      if (!trackData) {
        console.warn(
          `[GameLoop] 赛道 "${rawName}" 未注册，回退至 "motor-speedway-3d"`
        );
        trackData = this.track.loadTrack('motor-speedway-3d');
      }
      if (trackData) {
        // 创建物理赛车
        this.physics.createCar({
          id: 'player',
          position: trackData.startPoint,
          angle: trackData.startAngle,
        });
        // 同步赛车视觉模型初始位置
        const carState = this.physics.getCarState('player');
        if (carState && this.carModel) {
          this.carModel.updateFromPhysics(carState);
        }
        // 添加赛道碰撞边界（3D 格式: position/size/rotation）
        if (trackData.barriers && trackData.barriers.length > 0) {
          if (typeof this.physics.addBarriers === 'function') {
            this.physics.addBarriers(trackData.barriers);
          } else {
            for (const barrier of trackData.barriers) {
              this.physics.addBarrier(barrier);
            }
          }
        }
        // 初始化检查点系统
        this.checkpoints.init(trackData);
        this.checkpoints.registerCar('player');

        // 初始化摄像机控制器（获取渲染引擎的 camera 和 car 模型）
        if (this.camera && this.camera.init) {
          const cam = this.render.getCamera ? this.render.getCamera() : null;
          // CarModel 会在渲染引擎创建后挂载到 scene，此处传 null 作为占位
          // CameraController 在 update 中会使用 carState.position 计算位置
          if (cam) {
            this.camera.init(cam, null);
            if (window.DEBUG) console.log('[GameLoop] CameraController 已初始化');
          }
        }
      }
    });

    // --- 倒计时状态 ---
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
      this.audio.playMusic('race');
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
      this.ui.hideHUD();
      this.audio.playMusic('race');
    });
    this.state.onExit(STATE_FINISHED, () => {
      this.ui.hideResults();
    });

    // --- 全局状态变更 ---
    this.state.onStateChange((newState, prevState) => {
      if (newState === STATE_RACING && prevState !== STATE_RACING) {
        this._lastTime = performance.now() / 1000;
      }
      // 更新摄像机视角跟随赛车（3D）
      if (newState === STATE_RACING || newState === STATE_COUNTDOWN) {
        const car = this.physics.getCarState('player');
        if (car) {
          if (this.camera && this.camera.update) {
            this.camera.update(0, car);
          } else {
            // 兼容：无 CameraController 时直接 setCamera
            const angle = car.rotation ? car.rotation.y : 0;
            this.render.setCamera(car.position, angle);
          }
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

    // UI 按钮动作 → 状态切换
    this.eventBus.on(EVENT_ACTION, (action) => {
      if (action === 'start' && this.state.is(STATE_MENU)) {
        this.state.setState(STATE_COUNTDOWN);
      } else if (action === 'restart' && this.state.is(STATE_FINISHED)) {
        this.state.setState(STATE_MENU);
      }
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
    if (window.DEBUG) console.log('[GameLoop] Initialized successfully');
  }

  /**
   * 启动游戏循环。
   * 调用前必须已调用 init()。
   */
  start() {
    if (this._running) return;
    if (window.DEBUG) console.log('[GameLoop] Starting game loop');
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
    // FPS 监控（仅 debug 模式下输出）
    // ================================================================
    if (window.DEBUG) {
      this._frameCount++;
      this._fpsAccumulator += frameTime;
      const nowSec = performance.now() / 1000;
      if (nowSec - this._lastFpsLogTime >= 1.0) {
        const avgFps = this._frameCount / (nowSec - this._lastFpsLogTime);
        console.log(`[GameLoop] FPS: ${Math.round(avgFps)}`);
        this._frameCount = 0;
        this._fpsAccumulator = 0;
        this._lastFpsLogTime = nowSec;
      }
    }

    // ================================================================
    // 输入状态采集（每帧执行，包括暂停状态 — 确保 ESC 等按键能被检测）
    // ================================================================
    const inputState = this.input.getState();

    // ================================================================
    // 物理更新（仅 racing 状态执行）
    // PhysicsEngine3D.update(dt, inputState) 内部管理 accumulator，
    // GameLoop 只需传入原始帧时间
    // ================================================================
    if (this.state.is(STATE_RACING)) {
      // 物理更新前记录赛车当前帧位置（作为检查点检测的"上一帧"位置）
      // 3D 中使用 x, z 平面坐标（y 为高度轴）
      const carBefore = this.physics.getCarState('player');
      const prevPos = carBefore
        ? { x: carBefore.position.x, z: carBefore.position.z }
        : null;
      if (prevPos) {
        this._prevCarPos['player'] = prevPos;
      }

      // PhysicsEngine3D 内部会做固定步长转换，并自动处理输入应用
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
          { x: carAfter.position.x, z: carAfter.position.z },
          this._prevCarPos['player']
        );
      }

      // 检测漂移状态变化并发射事件
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
    const playerCar =
      this.state.is(STATE_RACING) || this.state.is(STATE_COUNTDOWN)
        ? this.physics.getCarState('player')
        : null;
    const allCars = this.physics.getAllCarStates
      ? this.physics.getAllCarStates()
      : playerCar
        ? [playerCar]
        : [];

    // 获取赛道数据
    const trackData = this.track.getCurrentTrack
      ? this.track.getCurrentTrack()
      : this.track.getTrackData
        ? this.track.getTrackData()
        : null;

    // 摄像机更新（仅在赛车可用时）
    if (playerCar && this.camera && this.camera.update) {
      this.camera.update(frameTime, playerCar);
    }

    // 更新赛车视觉模型位置（每帧）
    if (playerCar && this.carModel) {
      this.carModel.updateFromPhysics(playerCar);
      this.carModel.updateWheelSpin(playerCar.speed);
    }

    // 调用渲染引擎（传入 scene 和 camera，RenderEngine3D.render(scene, camera)）
    this.render.render(this.render.scene, this.render.camera);

    // ================================================================
    // 音频更新
    // ================================================================
    if (this.state.is(STATE_RACING) && playerCar) {
      this.audio.playEngine(playerCar.rpm, playerCar.speed);
    }

    // ================================================================
    // HUD 更新（比赛中/暂停时显示）
    // ================================================================
    if (this.state.is(STATE_RACING) || this.state.is(STATE_PAUSED)) {
      this.ui.updateHUD({
        speed: playerCar ? playerCar.speed : 0,
        gear: playerCar ? (playerCar.gear || 1) : 1,
        rpm: playerCar ? (playerCar.rpm || 0) : 0,
        lap: this.checkpoints.getLap('player') + 1,
        totalLaps: trackData ? trackData.lapCount : 3,
        elapsedTime: this._elapsedTime,
        time: this._elapsedTime,
        isDrifting: playerCar ? playerCar.isDrifting : false,
        position: 1,
        isRacing: this.state.is(STATE_RACING),
      });
    }

    // 调度下一帧
    this._rafId = requestAnimationFrame(() => this._tick());
  }
}
