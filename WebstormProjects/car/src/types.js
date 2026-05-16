/**
 * @file 游戏类型定义和常量
 *
 * 本文件定义了所有模块间共享的类型、接口和常量。
 * 使用 JSDoc 描述接口规范，所有模块必须遵循此处定义的数据结构。
 *
 * ===== 模块接口速查 =====
 * - EventBus:     on / off / emit
 * - GameState:    setState / onEnter / onExit / onStateChange / is / isValidTransition
 * - GameLoop:     init / start / pause / resume / stop
 * - PhysicsEngine: update / applyForce / applyTorque / checkCollisions / getCarState
 * - RenderEngine:  init / render / setCamera
 * - InputController: getState / onAction
 * - TrackManager:   loadTrack / getTrackData
 * - AudioManager:   init / playEngine / playDrift / playCollision / playCountdown / playLapComplete / playMusic / setVolume
 * - UIManager:      showMenu / hideMenu / showCountdown / hideCountdown / showPauseMenu / hidePauseMenu / showResults / hideResults / updateHUD
 */

// ============================================================
// 事件名称常量
// 所有跨模块通信通过 EventBus 使用以下事件名
// ============================================================

/** 游戏状态变更 */
export const EVENT_STATE_CHANGE = 'stateChange';
/** 赛车发生碰撞 */
export const EVENT_COLLISION = 'collision';
/** 完成一圈 */
export const EVENT_LAP_COMPLETE = 'lapComplete';
/** 比赛完成（所有圈数完成） */
export const EVENT_RACE_COMPLETE = 'raceComplete';
/** 漂移开始 */
export const EVENT_DRIFT_START = 'driftStart';
/** 漂移结束 */
export const EVENT_DRIFT_END = 'driftEnd';
/** 倒计时滴答声 */
export const EVENT_COUNTDOWN_TICK = 'countdownTick';
/** 按键动作触发 */
export const EVENT_ACTION = 'action';
/** 倒计时完成（UI 组件触发 → GameLoop 切换至 racing） */
export const EVENT_COUNTDOWN_COMPLETE = 'countdownComplete';
/** 通过检查点（CheckpointSystem 触发） */
export const EVENT_CHECKPOINT_PASSED = 'checkpointPassed';

// ============================================================
// 游戏状态常量
// 状态转换: menu → countdown → racing ↔ paused → finished → menu
// ============================================================

export const STATE_MENU = 'menu';
export const STATE_COUNTDOWN = 'countdown';
export const STATE_RACING = 'racing';
export const STATE_PAUSED = 'paused';
export const STATE_FINISHED = 'finished';

/** 所有有效状态列表 */
export const VALID_STATES = [
  STATE_MENU,
  STATE_COUNTDOWN,
  STATE_RACING,
  STATE_PAUSED,
  STATE_FINISHED,
];

/** 状态转换映射表 */
export const STATE_TRANSITIONS = {
  [STATE_MENU]: [STATE_COUNTDOWN],
  [STATE_COUNTDOWN]: [STATE_RACING],
  [STATE_RACING]: [STATE_PAUSED, STATE_FINISHED],
  [STATE_PAUSED]: [STATE_RACING],
  [STATE_FINISHED]: [STATE_MENU],
};

// ============================================================
// 物理常量
// ============================================================

/** 固定物理更新步长（秒），对应 60 FPS */
export const FIXED_DT = 1 / 60;

/** 最大帧时间（秒），防止 tab 切换后时间突跳导致的螺旋死亡 */
export const MAX_FRAME_TIME = 0.05;

/** 倒计时持续时间（秒） */
export const COUNTDOWN_DURATION = 3;

// ============================================================
// 以下为 JSDoc 类型定义，供 IDE 和开发者参考
// ============================================================

/**
 * 2D 向量
 * @typedef {Object} Vector2D
 * @property {number} x - X 分量
 * @property {number} y - Y 分量
 */

/**
 * 赛车实体
 * @typedef {Object} CarEntity
 * @property {string} id - 唯一标识
 * @property {Vector2D} position - 世界坐标（米）
 * @property {Vector2D} velocity - 速度（米/秒）
 * @property {number} angle - 朝向（弧度）
 * @property {number} angularVelocity - 角速度（弧度/秒）
 * @property {number} speed - 当前速率（米/秒）
 * @property {boolean} isDrifting - 是否漂移中
 * @property {number} lap - 当前圈数
 * @property {number} checkpoint - 当前检查点索引
 */

/**
 * 赛道碰撞边界
 * @typedef {Object} Barrier
 * @property {Vector2D[]} points - 多边形顶点坐标数组
 */

/**
 * 赛道数据
 * @typedef {Object} TrackData
 * @property {string} name - 赛道名称
 * @property {Vector2D[]} checkpoints - 检查点坐标序列
 * @property {Barrier[]} barriers - 碰撞边界数组
 * @property {Vector2D} startPoint - 起点位置
 * @property {number} startAngle - 起点朝向（弧度）
 * @property {number} lapCount - 总圈数
 */

/**
 * 碰撞事件
 * @typedef {Object} CollisionEvent
 * @property {string} carId - 发生碰撞的赛车 ID
 * @property {Barrier} [barrier] - 碰撞的障碍物（车辆与障碍物碰撞时存在）
 * @property {string} [otherCarId] - 另一辆车的 ID（车辆间碰撞时存在）
 * @property {number} impactForce - 碰撞冲击力（牛顿）
 */

/**
 * 输入状态
 * @typedef {Object} InputState
 * @property {number} throttle - 油门值 0~1
 * @property {number} brake - 刹车值 0~1
 * @property {number} steer - 转向值 -1~1（负=左，正=右）
 * @property {boolean} drift - 是否按下漂移键
 * @property {boolean} pause - 是否按下暂停键
 */

/**
 * HUD 数据
 * @typedef {Object} HUDData
 * @property {number} speed - 当前速度（米/秒）
 * @property {number} lap - 当前圈数
 * @property {number} maxLaps - 总圈数
 * @property {Vector2D} position - 赛车位置
 */

/**
 * 事件总线接口
 * @interface IEventBus
 * @method on(event, callback)    - 订阅事件，返回取消订阅函数
 * @method off(event, callback)   - 取消订阅
 * @method emit(event, data)      - 发布事件
 */

/**
 * 游戏状态机接口
 * @interface IGameState
 * @method setState(newState)      - 设置新状态（总是触发 onEnter）
 * @method onEnter(state, cb)      - 注册状态进入回调
 * @method onExit(state, cb)       - 注册状态退出回调
 * @method onStateChange(cb)       - 注册状态变更回调
 * @method is(state)               - 判断当前状态
 * @method isValidTransition(newState) - 判断状态转换是否合法
 */

/**
 * 物理引擎接口
 * @interface IPhysicsEngine
 * @method update(dt)               - 物理更新
 * @method applyForce(carId, force) - 施加力
 * @method applyTorque(carId, torque) - 施加扭矩
 * @method checkCollisions()        - 检测碰撞，返回 CollisionEvent[]
 * @method getCarState(carId)       - 获取赛车状态
 */

/**
 * 渲染引擎接口
 * @interface IRenderEngine
 * @method init(canvas)                                     - 初始化渲染
 * @method render(cars, track, gameState)                   - 渲染帧
 * @method setCamera(position, angle)                       - 设置摄像机
 */

/**
 * 输入控制器接口
 * @interface IInputController
 * @method getState()               - 获取当前输入状态
 * @method onAction(action, cb)     - 注册动作回调
 */

/**
 * 赛道管理器接口
 * @interface ITrackManager
 * @method loadTrack(name)          - 加载赛道
 * @method getTrackData()           - 获取赛道数据
 */

/**
 * 音效管理器接口
 * @interface IAudioManager
 * @method init()                          - 初始化音效系统
 * @method playEngine(speed)               - 播放引擎声
 * @method playDrift()                     - 播放漂移声
 * @method playCollision()                 - 播放碰撞声
 * @method playCountdown()                 - 播放倒计时音效
 * @method playLapComplete(lap)            - 播放圈完成音效
 * @method playMusic(track)                - 播放背景音乐
 * @method setVolume(volume)               - 设置音量 0~1
 */

/**
 * UI 管理器接口
 * @interface IUIManager
 * @method showMenu()                      - 显示主菜单
 * @method hideMenu()                      - 隐藏主菜单
 * @method showCountdown(value)            - 显示倒计时数字
 * @method hideCountdown()                 - 隐藏倒计时
 * @method showPauseMenu()                 - 显示暂停菜单
 * @method hidePauseMenu()                 - 隐藏暂停菜单
 * @method showResults()                   - 显示比赛结果
 * @method hideResults()                   - 隐藏比赛结果
 * @method updateHUD(data)                 - 更新 HUD 显示
 */

/**
 * 游戏主循环接口
 * @interface IGameLoop
 * @method init()          - 初始化游戏循环（注册回调、设置初始状态）
 * @method start()         - 启动游戏循环
 * @method pause()         - 暂停游戏（racing → paused）
 * @method resume()        - 恢复游戏（paused → racing）
 * @method stop()          - 停止游戏循环
 */

export default {};
