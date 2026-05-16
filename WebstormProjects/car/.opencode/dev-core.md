# Dev-1 工作日志 - 游戏主循环 & 状态机

> **模块**：游戏主循环 & 状态机
> **文件范围**：`src/core/GameLoop.js`, `src/core/GameState.js`, `src/core/EventBus.js`, `src/core/index.js`, `src/types.js`, `index.html`, `main.js`
> **角色**：集成责任人

## 开发状态
✅ 已完成（已通过审查修复）

## 任务进度
- [x] 定义所有模块接口（src/types.js）
- [x] 实现 EventBus 事件总线
- [x] 实现 GameState 状态机（Menu → Countdown → Racing → Paused → Finished）
- [x] 实现 GameLoop 固定步长游戏循环
- [x] 创建 index.html 入口
- [x] 创建 main.js 组装所有模块
- [x] 集成验证所有调用链路
- [x] 审查修复：赛道名兼容映射（BLOCKER #1 部分修复）
- [x] 审查修复：漂移事件发射兼容层（BLOCKER #2 兼容修复）
- [x] 审查修复：CheckpointSystem 集成（BLOCKER #3）
- [x] 审查修复：非 racing 状态 getCarState 守卫（WARNING #2）
- [x] 审查修复：离屏 Canvas 网格预渲染优化（INFO #1）

## 变更文件清单

| 文件 | 说明 |
|------|------|
| `src/types.js` | 类型定义、事件常量、游戏状态常量、物理常量、JSDoc 接口定义（全部 8 个模块接口） |
| `src/core/EventBus.js` | 事件总线：on/off/emit/once/clear 方法 |
| `src/core/GameState.js` | 状态机：setState/onEnter/onExit/onStateChange/is/isValidTransition |
| `src/core/GameLoop.js` | 固定步长游戏循环 + CheckpointSystem 集成 + 漂移事件发射 + 赛道名映射回退 + 空安全守卫 |
| `src/core/index.js` | Core 模块统一导出 |
| `index.html` | 全屏 Canvas、深色背景、加载提示、模块脚本入口 |
| `main.js` | 模块组装 + 新增 CheckpointSystem 实例化 + 赛道名改为 'motor-speedway' |
| `src/render/RenderEngine.js` | [新增+优化] 渲染引擎 + 离屏 Canvas pattern 网格预渲染 |
| `src/render/Camera.js` | [新增] 摄像机系统（集成修复） |
| `src/render/Sprites.js` | [新增] 精灵绘制（集成修复） |
| `src/render/index.js` | [新增] 渲染模块导出（集成修复） |
| `src/ui/UIManager.js` | [新增] UI 管理器包装类（集成修复） |

## 接口实现状态

| 接口 | 状态 | 说明 |
|------|------|------|
| `IEventBus` | ✅ | on/off/emit + once/clear 辅助方法 |
| `IGameState` | ✅ | setState/onEnter/onExit/onStateChange/is/isValidTransition |
| `IGameLoop` | ✅ | init/start/pause/resume/stop |

---

## 🔴 集成检查报告

### 检查的 11 个集成断裂点

| # | 问题 | 严重度 | 状态 | 修复方式 |
|---|------|--------|------|---------|
| 1 | **渲染引擎缺失** | BLOCKER | ✅ 已修复 | 创建 `RenderEngine.js` / `Camera.js` / `Sprites.js` |
| 2 | **PhysicsEngine.update() 签名不匹配** | BLOCKER | ✅ 已修复 | GameLoop 改为 `physics.update(frameTime, inputState)` |
| 3 | **PhysicsEngine.init() 未调用** | HIGH | ✅ 已修复 | 菜单退出时传入赛车配置 + 赛道边界进行初始化 |
| 4 | **checkCollisions() 未调用** | HIGH | ✅ 已修复 | 物理更新后调用并发射 EVENT_COLLISION |
| 5 | **getTrackData() 不存在** | HIGH | ✅ 已修复 | 改为调用 `track.getCurrentTrack()` ✓ TrackLoader 原生方法 |
| 6 | **无 UIManager 包装类** | BLOCKER | ✅ 已修复 | 创建 `UIManager.js`，整合 HUD/Menu/Countdown |
| 7 | **InputMapper 构造函数不匹配** | BLOCKER | ✅ 已修复 | main.js 改为 `new InputMapper()` 无参数 |
| 8 | **InputMapper.init() 未调用** | HIGH | ✅ 已修复 | 添加 `inputMapper.init(container)` |
| 9 | **HUD 数据格式不匹配** | HIGH | ✅ 已修复 | GameLoop 传 `totalLaps/elapsedTime/isDrifting` |
| 10 | **倒计时逻辑冲突** | MEDIUM | ✅ 已修复 | 倒计时由 Countdown 组件内部驱动，完成时通过 EVENT_COUNTDOWN_COMPLETE 通知 GameLoop |
| 11 | **物理累加器双重管理** | LOW | ✅ 已修复 | GameLoop 仅传原始 frameTime，PhysicsEngine 内部管理 accumulator |

### 接口调用关系表验证

| 被调接口 | 提供方 | 调用方 | 调用代码 | 状态 |
|---------|--------|--------|---------|------|
| `update(dt, inputState)` | Dev-2 (Physics) | Dev-1 (GameLoop) | `_tick` → `physics.update(frameTime, inputState)` | ✅ |
| `render(cars, track, state)` | Dev-3 (Render) | Dev-1 (GameLoop) | `_tick` → `render.render(allCars, trackData, this.state.current)` | ✅ |
| `getState()` | Dev-4 (Input) | Dev-1 (GameLoop) | `_tick` → `this.input.getState()` → 传给 Physics | ✅ |
| `applyForce/applyTorque` | Dev-2 (Physics) | Dev-4 (Input) | `onAction` 回调 → 经 GameLoop 传递 | ✅ |
| `getCarState(id)` | Dev-2 (Physics) | Dev-3 (Render) | `_tick` → `physics.getCarState('player')` | ✅ |
| `playEngine(speed)` | Dev-6 (Audio) | Dev-1 (GameLoop) | `_tick` → `audio.playEngine(car.speed)` | ✅ |
| `playDrift/Collision` | Dev-6 (Audio) | Dev-2 (Physics) | 碰撞/漂移事件 → EventBus → AudioManager | ✅ |
| `loadTrack(name)` | Dev-5 (Track) | Dev-1 (GameLoop) | `init` → `track.loadTrack('circuit')` | ✅ |
| `updateHUD(data)` | Dev-7 (UI) | Dev-1 (GameLoop) | `_tick` → `ui.updateHUD({...})` | ✅ |

### 🔑 状态机关键约束验证

| 约束 | 验证结果 |
|------|---------|
| `setState(initialValue)` 触发 `onEnter` | ✅ GameLoop.init() 先注册回调后调用 `setState(STATE_MENU)` |
| 同名状态不跳过 | ✅ `newState === this.current` 时合法性检查被跳过 |
| 注册在 setState 之前 | ✅ 所有回调注册在同一个同步代码块中，最后才 `setState` |

### 🔑 UI 初始化链路验证

```
setState(STATE_MENU) → onEnter('menu') → ui.showMenu()
  → Menu.show({ onStart, onTrackSelect })
  → EventBus 等待用户操作

用户点击 START → EventBus emit 'action' → setState(STATE_COUNTDOWN)
  → onEnter('countdown') → ui.showCountdown(3)
  → Countdown.start(onComplete) 内部驱动 3→2→1→GO!
  → 完成后 → EventBus emit EVENT_COUNTDOWN_COMPLETE → setState(STATE_RACING)
  → render.render(cars, track, 'racing') + ui.updateHUD(...)
```

### 🔑 初始化死锁检查

```
AudioManager.init() ──────────────→ 无外部依赖 (Web Audio API)
TrackLoader() ───────────────────→ 无外部依赖 (内置赛道数据)
PhysicsEngine() ─────────────────→ 无外部依赖 (需 init() 时传赛车/赛道数据)
RenderEngine.init(canvas) ───────→ 无外部依赖 (仅需 Canvas)
InputMapper.init(container) ─────→ 无外部依赖 (DOM + event listeners)
UIManager(canvas, eventBus) ─────→ 依赖 eventBus (已创建)
GameLoop({...}) ─────────────────→ 依赖所有模块 (均已初始化)
```

✅ 无循环等待，所有模块依赖方向一致

### 关键语义约束验证

| 约束 | 状态 | 验证方式 |
|------|------|---------|
| 固定步长物理 dt=1/60s | ✅ | PhysicsEngine 内部 accumulator + FIXED_DT |
| accumulator 解耦物理/渲染 | ✅ | frameTime 传入 PhysicsEngine，其内部 while 循环处理 |
| 坐标系 Y 轴向上 | ✅ | Camera 变换中 scale(1, -1) 翻转 |
| 角度弧度制 | ✅ | 所有三角函数使用弧度 |
| 事件总线通信 | ✅ | 碰撞/倒计时/圈数/比赛完成均通过 EventBus |
| 初始化顺序正确 | ✅ | AudioManager → TrackLoader → PhysicsEngine → RenderEngine → InputMapper → UIManager → GameLoop |

### 死代码检查

| 文件 | 方法/导出 | 是否被调用 | 说明 |
|------|-----------|-----------|------|
| EventBus.once | 否 | 暂未使用，但为标准事件总线标配，保留 |
| EventBus.clear | 否 | 预留清理工具 |
| RenderEngine.setCamera | ✅ | GameLoop 状态变更时调用 |
| Camera.worldToScreen | 否 | 未来用于 UI 元素定位 |
| Sprites.drawCheckpoints | ✅ | RenderEngine 渲染时调用 |
| Sprites.drawStartPoint | ✅ | RenderEngine 渲染时调用 |
| PhysicsEngine.getAllCarStates | ✅ | GameLoop._tick 中调用 |

## 备注

### 集成修复总结
1. **Dev-3 (Render) 未交付** → 创建了完整的最小化渲染引擎（RenderEngine + Camera + Sprites）
2. **模块实际 API 与接口定义偏差** → 修复了 5 处命名/签名不匹配
3. **缺少包装层** → 创建 UIManager 统一 UI 接口
4. **事件总线未充分利用** → 修复碰撞事件和倒计时完成事件的流转

### 对接各模块的最终接口

| 模块 | 实例化方式 | 关键方法 | 
|------|-----------|---------|
| AudioManager | `new AudioManager()` → `await .init()` | playEngine/playCollision/playCountdown/playMusic/setVolume |
| TrackLoader | `new TrackLoader()` → `.loadTrack(name)` | loadTrack/getCurrentTrack/getTrackNames |
| CheckpointSystem | `new CheckpointSystem()` → `.init(trackData)` | registerCar/update/getLap/onCheckpointPassed/onLapComplete/onRaceComplete |
| PhysicsEngine | `new PhysicsEngine()` → `.init(cars, barriers)` | update/getCarState/checkCollisions/applyForce/applyTorque/setCarLap |
| RenderEngine | `new RenderEngine()` → `.init(canvas)` | render/setCamera |
| InputMapper | `new InputMapper()` → `.init(container)` | getState/onAction |
| UIManager | `new UIManager(canvas, eventBus)` | showMenu/hideMenu/showCountdown/hideCountdown/showPauseMenu/hidePauseMenu/showResults/hideResults/updateHUD/getSelectedTrack |

---

## 🔴 审查修复记录（第1轮审查）

### 🔴 BLOCKER 修复

| # | 问题 | 修复方式 | 文件 | 说明 |
|---|------|---------|------|------|
| 1 | **赛道名不匹配** | 兼容映射 + 默认回退 | `main.js` L50, `GameLoop.js` | main.js 预加载 'motor-speedway'；GameLoop 菜单退出时尝试 UI 选择的赛道名，失败回退 'motor-speedway' |
| 2 | **漂移事件未发射** | GameLoop 层面检测漂移状态变化并 emit | `GameLoop.js` _tick() L366-L376 | 每帧 physics.update 后比较 `carAfter.isDrifting !== _prevDrifting`，变化时 emit EVENT_DRIFT_START/END |
| 3 | **CheckpointSystem 未集成** | 完整集成到 GameLoop + main.js | `GameLoop.js`, `main.js` | main.js 实例化 + 传入 deps；GameLoop 在 onExit('menu') 中 init+registerCar，_tick 中每帧 update()；HUD 使用 checkpoints.getLap() |

### 🟡 WARNING 修复（Dev-1 负责部分）

| # | 问题 | 修复方式 | 文件 |
|---|------|---------|------|
| 2 | **非 racing 状态 getCarState 可能返回 null** | 渲染帧仅在 RACING/COUNTDOWN 状态调用 getCarState | `GameLoop.js` _tick() L387-L391 |

### 🟢 INFO 修复

| # | 问题 | 修复方式 | 文件 |
|---|------|---------|------|
| 1 | **离屏 Canvas 未使用** | 改用 `createPattern` 预渲染网格单元 + 偏移实现摄像机跟随 | `RenderEngine.js` _renderBackground() |

### 🔴 需其他 Developer 修复的 BLOCKER/WARNING

| # | 问题 | 严重度 | 责任 Developer | 说明 |
|---|------|--------|---------------|------|
| 1(根本) | **赛道数据只注册了 'motor-speedway'** | BLOCKER | Dev-5 | TrackData.js 需添加 'circuit'/'mountain'/'desert' 赛道数据 |
| 2(根本) | **PhysicsEngine 未发射漂移事件** | BLOCKER | Dev-2 | PhysicsEngine 应持有 eventBus 引用并发射漂移事件 |
| 4 | **音乐振荡器泄漏** | BLOCKER | Dev-6 | playMusic() 切换音乐时未停止旧振荡器 |
| W1 | **暂停键映射不一致** | WARNING | Dev-4 / Dev-7 | KeyP vs Escape 不匹配 |
| W3 | **转向回正速率可能过慢** | WARNING | Dev-4 | rampDown 8.0/s 可增至 12.0/s |
| W4 | **切换音乐时旧音乐未停止** | WARNING | Dev-6 | playMusic 应先停止旧音乐 |
| W5 | **角度归一化未处理 angularVelocity** | WARNING | Dev-2 | angularVelocity 缺少上限钳制 |
