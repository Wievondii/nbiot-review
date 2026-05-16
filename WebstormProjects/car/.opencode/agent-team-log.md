# Agent Team 共享日志

> **项目**：网页赛车游戏（Racing Game）
> **创建时间**：2026-05-16 17:26
> **当前轮次**：第 1 轮

---

## 📝 经验教训
<!-- 第1轮，暂无历史 -->

---

## 📋 第1轮计划

### 需求分析
- **一句话总结**：从零构建一个基于 HTML5 Canvas 的网页赛车游戏，包含赛车控制、赛道系统、物理引擎、UI界面和音效系统
- **涉及模块**：游戏引擎、物理系统、渲染系统、输入控制、UI系统、音效系统、赛道管理
- **技术栈**：HTML5 Canvas + Vanilla JavaScript + requestAnimationFrame 游戏循环
- **项目类型**：有接口项目（模块间需要大量数据交互）

### 架构模式
采用 **ECS（Entity-Component-System）+ 状态机** 架构：
- **游戏状态机**：Menu → Countdown → Racing → Finished
- **实体组件系统**：赛车、障碍物、道具作为实体，物理/渲染/输入作为组件
- **事件总线**：模块间通过事件解耦通信

### 规范定义

#### 代码风格规范
```
- 使用 ES6+ 模块系统（import/export）
- 类名 PascalCase，方法/变量 camelCase，常量 UPPER_SNAKE_CASE
- 每个模块独立文件，通过 index.js 统一导出
- 使用 JSDoc 注释公共接口
- 物理量统一使用国际单位（米、秒、米/秒）
```

#### 接口规范

```typescript
// === 核心接口定义 ===

// 游戏状态
export type GameState = 'menu' | 'countdown' | 'racing' | 'paused' | 'finished';

// 2D 向量
export interface Vector2D {
  x: number;
  y: number;
}

// 赛车实体
export interface CarEntity {
  id: string;
  position: Vector2D;       // 世界坐标（米）
  velocity: Vector2D;       // 速度（米/秒）
  angle: number;            // 朝向（弧度）
  angularVelocity: number;  // 角速度（弧度/秒）
  speed: number;            // 当前速率（米/秒）
  isDrifting: boolean;      // 是否漂移中
  lap: number;              // 当前圈数
  checkpoint: number;       // 当前检查点
}

// 物理引擎接口
export interface PhysicsEngine {
  update(dt: number): void;
  applyForce(carId: string, force: Vector2D): void;
  applyTorque(carId: string, torque: number): void;
  checkCollisions(): CollisionEvent[];
  getCarState(carId: string): CarEntity;
}

// 渲染引擎接口
export interface RenderEngine {
  init(canvas: HTMLCanvasElement): void;
  render(cars: CarEntity[], track: TrackData, gameState: GameState): void;
  setCamera(position: Vector2D, angle: number): void;
}

// 输入控制器接口
export interface InputController {
  getState(): InputState;
  onAction(action: string, callback: (data?: any) => void): void;
}

export interface InputState {
  throttle: number;   // 0-1 油门
  brake: number;      // 0-1 刹车
  steer: number;      // -1 到 1 转向
  drift: boolean;     // 漂移按钮
  pause: boolean;     // 暂停按钮
}

// 赛道数据接口
export interface TrackData {
  name: string;
  checkpoints: Vector2D[];  // 检查点序列
  barriers: Barrier[];      // 碰撞边界
  startPoint: Vector2D;     // 起点位置
  startAngle: number;       // 起点朝向
  lapCount: number;         // 总圈数
}

export interface Barrier {
  points: Vector2D[];  // 多边形顶点
}

// 碰撞事件
export interface CollisionEvent {
  carId: string;
  barrier?: Barrier;
  otherCarId?: string;
  impactForce: number;
}

// 音效管理器接口
export interface AudioManager {
  init(): void;
  playEngine(speed: number): void;
  playDrift(): void;
  playCollision(): void;
  playCountdown(): void;
  playLapComplete(lap: number): void;
  playMusic(track: string): void;
  setVolume(volume: number): void;
}

// 游戏主循环接口
export interface GameLoop {
  init(): void;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
}
```

#### 接口调用关系表（🔑 防止集成断裂）

| 被调接口 | 提供方 | 调用方 | 调用时机 | 必须调用的位置 |
|---------|--------|--------|---------|-------------|
| `update(dt)` | Dev-2 (Physics) | Dev-1 (GameLoop) | 每帧更新 | GameLoop.update() 中 |
| `render(cars, track, state)` | Dev-3 (Render) | Dev-1 (GameLoop) | 每帧渲染 | GameLoop.render() 中 |
| `getState()` | Dev-4 (Input) | Dev-2 (Physics) | 每帧读取输入 | Physics.update() 开头 |
| `applyForce/applyTorque` | Dev-2 (Physics) | Dev-4 (Input) | 按键按下时 | Input.onAction() 回调中 |
| `getCarState(id)` | Dev-2 (Physics) | Dev-3 (Render) | 每帧获取位置 | Render.render() 开头 |
| `playEngine(speed)` | Dev-6 (Audio) | Dev-1 (GameLoop) | 每帧更新引擎音 | GameLoop.render() 中 |
| `playDrift/Collision` | Dev-6 (Audio) | Dev-2 (Physics) | 碰撞/漂移触发 | Physics.checkCollisions() 后 |
| `loadTrack(name)` | Dev-5 (Track) | Dev-1 (GameLoop) | 游戏开始时 | GameLoop.init() 中 |
| `updateHUD(data)` | Dev-7 (UI) | Dev-1 (GameLoop) | 每帧更新HUD | GameLoop.render() 末尾 |

### 🔑 关键语义约束

| 约束规则 | 说明 |
|---------|------|
| **游戏循环固定步长** | 物理更新使用固定 dt=1/60s，渲染使用可变 dt，通过 accumulator 解耦 |
| **坐标系统一** | 世界坐标系：Y轴向上为正，X轴向右为正；屏幕坐标系由渲染层转换 |
| **角度统一** | 所有角度使用弧度制，0度指向X轴正方向，逆时针为正 |
| **事件总线** | 所有跨模块通知通过 EventBus 发布，禁止直接引用其他模块实例 |
| **初始化顺序** | AudioManager → TrackManager → PhysicsEngine → RenderEngine → InputController → GameLoop |

### 模块划分

| 模块 | Developer | 文件范围 | 依赖规范 |
|------|-----------|---------|---------|
| **1. 游戏主循环 & 状态机** | Dev-1 | `src/core/GameLoop.js`, `src/core/GameState.js`, `src/core/EventBus.js`, `src/core/index.js` | 依赖所有其他模块接口 |
| **2. 物理引擎** | Dev-2 | `src/physics/PhysicsEngine.js`, `src/physics/Collision.js`, `src/physics/Drift.js`, `src/physics/index.js` | PhysicsEngine 接口 |
| **3. 渲染引擎** | Dev-3 | `src/render/RenderEngine.js`, `src/render/Camera.js`, `src/render/Sprites.js`, `src/render/index.js` | RenderEngine 接口 |
| **4. 输入控制** | Dev-4 | `src/input/Keyboard.js`, `src/input/Touch.js`, `src/input/InputMapper.js`, `src/input/index.js` | InputController 接口 |
| **5. 赛道系统** | Dev-5 | `src/track/TrackLoader.js`, `src/track/TrackData.js`, `src/track/Checkpoint.js`, `src/track/index.js` | TrackData 接口 |
| **6. 音效系统** | Dev-6 | `src/audio/AudioManager.js`, `src/audio/SoundPool.js`, `src/audio/index.js` | AudioManager 接口 |
| **7. UI系统** | Dev-7 | `src/ui/HUD.js`, `src/ui/Menu.js`, `src/ui/Countdown.js`, `src/ui/index.js` | UI 组件接口 |

### 并行策略

**阶段1（可并行）**：Dev-2~7 同时开发各自模块，Dev-1 定义接口和事件总线
**阶段2（集成）**：Dev-1（集成负责人）将所有模块组装，验证调用链路
**阶段3（联调）**：全体修复集成问题

所有 Developer 同时开始，遵循以下顺序：
1. Dev-1 先完成接口定义和 EventBus（预计30分钟）
2. Dev-2~7 基于接口并行开发各自模块
3. Dev-1 最后进行集成组装

### 文件归属表

| 文件路径 | 归属 Developer |
|---------|---------------|
| `src/core/*` | Dev-1 |
| `src/physics/*` | Dev-2 |
| `src/render/*` | Dev-3 |
| `src/input/*` | Dev-4 |
| `src/track/*` | Dev-5 |
| `src/audio/*` | Dev-6 |
| `src/ui/*` | Dev-7 |
| `src/types.js` | Dev-1 |
| `index.html` | Dev-1 |
| `main.js` | Dev-1 |
| `assets/*` | Dev-3（图片）/ Dev-6（音频） |

### 集成责任人
- **集成负责人**：Dev-1（游戏主循环模块）
- **职责**：
  1. 定义所有模块接口
  2. 实现 EventBus 事件总线
  3. 在所有模块开发完成后进行集成组装
  4. 验证接口调用关系表中的所有调用链路
  5. 确保初始化顺序正确

### 整体验收标准
- [ ] 游戏可以从开始菜单进入比赛状态
- [ ] 赛车可以通过键盘控制加速、刹车、转向、漂移
- [ ] 赛车与赛道边界发生碰撞时有正确的物理反馈
- [ ] 漂移系统工作正常，漂移时有视觉和音效反馈
- [ ] 赛道检查点系统正确记录圈数
- [ ] HUD 实时显示速度、圈数、时间
- [ ] 倒计时系统正常工作
- [ ] 音效系统播放引擎声、漂移声、碰撞声
- [ ] 游戏循环稳定 60FPS，无明显卡顿
- [ ] 所有接口调用链路完整（无定义但未调用的接口）

### 风险提示
- **风险1**：物理引擎与渲染不同步 → **应对**：使用固定步长物理更新 + accumulator 模式
- **风险2**：漂移手感调优困难 → **应对**：将漂移参数（摩擦力、转向系数）提取为可配置常量
- **风险3**：多模块集成时接口不匹配 → **应对**：Dev-1 先发布接口定义，其他模块基于 Mock 数据开发
- **风险4**：Canvas 渲染性能不足 → **应对**：使用离屏 Canvas 预渲染静态元素（赛道），每帧只重绘动态元素

---
✅ 计划完成

---

## 🔍 第1轮审查

### 审查结论
**❌ 需修改** — 发现 4 个 BLOCKER 级问题 + 5 个 WARNING 级问题

### 模块审查结果

| 模块 | Reviewer | 结论 | BLOCKER | WARNING | INFO |
|------|----------|------|---------|---------|------|
| 核心模块 (Dev-1) | Reviewer | ❌ | 3 | 2 | 1 |
| 物理引擎 (Dev-2) | Reviewer | ✅ | 0 | 1 | 0 |
| 渲染引擎 (Dev-1代) | Reviewer | ⚠️ | 0 | 1 | 1 |
| 输入控制 (Dev-4) | Reviewer | ✅ | 0 | 0 | 0 |
| 赛道系统 (Dev-5) | Reviewer | ✅ | 0 | 0 | 0 |
| 音效系统 (Dev-6) | Reviewer | ❌ | 1 | 1 | 0 |
| UI系统 (Dev-7) | Reviewer | ✅ | 0 | 0 | 0 |

### 问题摘要

#### 🔴 严重问题（必须修复）

| # | 文件 | 位置 | 问题描述 | 建议修复方案 | 责任 Developer |
|---|------|------|----------|-------------|---------------|
| 1 | `main.js` + `src/track/TrackData.js` | 第50行 | **赛道名称不匹配**：菜单提供 'circuit'/'mountain'/'desert' 三个选项，但 TrackLoader 只注册了 'motor-speedway'。`loadTrack('circuit')` 返回 null → 物理引擎无法初始化 → 游戏完全无法运行 | 在 TrackData.js 中注册 'circuit'/'mountain'/'desert' 赛道，或将菜单选项改为 'motor-speedway' | Dev-1 + Dev-5 |
| 2 | `src/physics/PhysicsEngine.js` | `updateCar()` | **漂移事件未发射**：PhysicsEngine 调用 `updateDriftState()` 更新漂移状态，但从未通过 EventBus 发射 `EVENT_DRIFT_START` / `EVENT_DRIFT_END`。GameLoop 监听了这些事件来播放漂移音效，但永远收不到 → 漂移音效不工作 | 在 `updateCar()` 中检测漂移状态变化时，通过 EventBus 发射漂移开始/结束事件。需要 PhysicsEngine 持有 eventBus 引用或通过回调通知 | Dev-2 + Dev-1 |
| 3 | `main.js` + `src/core/GameLoop.js` | 全局 | **CheckpointSystem 未集成**：检查点系统已完整实现但从未在 main.js 中实例化，也未在 GameLoop 中调用 `registerCar()` / `update()`。圈数记录和比赛完成事件（`EVENT_RACE_COMPLETE`）不会触发 → 比赛永远无法结束 | 在 main.js 中创建 CheckpointSystem 实例，在 GameLoop._tick() 中每帧调用 `checkpointSystem.update('player', position, prevPosition)`，并在圈完成/比赛完成时通过 EventBus 发射事件 | Dev-1 |
| 4 | `src/audio/AudioManager.js` | `playMusic()` / `_startAmbient()` | **音乐振荡器泄漏**：`playMusic()` 检查 `_musicPlaying` 防止重复播放，但切换音乐时（如 racing→menu）旧振荡器从未被 stop() 和 disconnect()。每次调用 playMusic 都会创建新的振荡器，旧的在后台持续运行 → 内存泄漏 + 多音叠加 | 在 `_startAmbient()` 开头停止并断开旧的 `_musicOscs`，重置 `_musicPlaying = false` 后再创建新的 | Dev-6 |

#### 🟡 警告（建议修复）

| # | 文件 | 位置 | 问题描述 | 建议修复方案 | 责任 Developer |
|---|------|------|----------|-------------|---------------|
| 1 | `src/input/Keyboard.js` | 第21行 | **暂停键映射不一致**：KEY_ACTIONS 中 `KeyP: 'pause'`，但 Menu.js 操作说明显示 "ESC = Pause"。用户会按 ESC 但无响应 | 将 KeyP 改为 Escape，或在操作说明中改为 "P = Pause" | Dev-4 + Dev-7 |
| 2 | `src/core/GameLoop.js` | `_tick()` | **非 racing 状态下 getCarState 可能返回 null**：在 menu/countdown 状态下调用 `physics.getCarState('player')`，但此时物理引擎可能尚未初始化（init 在 onExit('menu') 中调用），返回 null。虽然有 fallback，但 render 会收到空数组 | 在 `_tick()` 开头增加 `if (!this.physics.cars || this.physics.cars.size === 0)` 守卫，或确保 getCarState 在未初始化时返回安全的默认状态 | Dev-1 |
| 3 | `src/input/InputMapper.js` | `_smoothValue()` | **转向回正速率可能过慢**：当 target=0 时使用 rampDown=8.0/s，但如果当前 steer=0.5，需要 ~62ms 回正。在 60FPS 下约 4 帧，可能导致松开方向键后仍有轻微转向 | 考虑增大 rampDown 至 12.0/s 或使用更快的回正曲线 | Dev-4 |
| 4 | `src/audio/AudioManager.js` | `playMusic()` | **切换音乐时未停止旧音乐**：从 'racing' 切换到 'menu' 时，`_musicPlaying` 仍为 true，导致 `playMusic('menu')` 直接 return，背景音乐不会切换 | 在 `playMusic()` 中先调用停止旧音乐的逻辑，再播放新音乐 | Dev-6 |
| 5 | `src/physics/PhysicsEngine.js` | `updateCar()` 第332行 | **角度归一化未处理 angularVelocity**：`car.angle` 被归一化到 [0, 2π)，但 `car.angularVelocity` 可能累积到很大值（如碰撞后），导致角度在单帧内旋转过度 | 对 angularVelocity 增加上限钳制，如 `Math.abs(car.angularVelocity) > Math.PI * 2` 时截断 | Dev-2 |

#### 🟢 建议（可选优化）

| # | 文件 | 位置 | 问题描述 | 建议修复方案 | 责任 Developer |
|---|------|------|----------|-------------|---------------|
| 1 | `src/render/RenderEngine.js` | `_renderBackground()` | **离屏 Canvas 未使用**：构造函数中有 `_bgCanvas` 和 `_bgReady` 字段，但 `_renderBackground()` 每帧都重新绘制网格，未使用预渲染优化 | 实现离屏 Canvas 预渲染：首次渲染时将赛道地面绘制到 `_bgCanvas`，后续帧直接 drawImage | Dev-1 |

### 集成修复验证（Dev-1 报告的 11 个问题）

| # | 问题 | 验证结果 | 说明 |
|---|------|---------|------|
| 1 | 渲染引擎缺失 | ✅ 已修复 | RenderEngine/Camera/Sprites 已创建 |
| 2 | PhysicsEngine.update() 签名不匹配 | ✅ 已修复 | GameLoop 传入 (frameTime, inputState) |
| 3 | PhysicsEngine.init() 未调用 | ✅ 已修复 | onExit('menu') 中调用 |
| 4 | checkCollisions() 未调用 | ✅ 已修复 | _tick() 中物理更新后调用 |
| 5 | getTrackData() 不存在 | ✅ 已修复 | 改为 getCurrentTrack() |
| 6 | 无 UIManager 包装类 | ✅ 已修复 | UIManager.js 已创建 |
| 7 | InputMapper 构造函数不匹配 | ✅ 已修复 | main.js 使用 new InputMapper() 无参数 |
| 8 | InputMapper.init() 未调用 | ✅ 已修复 | main.js 中调用 init(container) |
| 9 | HUD 数据格式不匹配 | ✅ 已修复 | 传入 totalLaps/elapsedTime/isDrifting |
| 10 | 倒计时逻辑冲突 | ✅ 已修复 | Countdown 内部驱动 + EventBus 通知 |
| 11 | 物理累加器双重管理 | ✅ 已修复 | PhysicsEngine 内部管理 accumulator |

### 亮点
- **EventBus 实现干净**：once/clear 辅助方法完善，emit 时复制 listeners 防止遍历时修改
- **物理引擎架构优秀**：accumulator 模式、半隐式欧拉积分、SAT 碰撞检测 + 空间网格优化
- **输入系统平滑处理到位**：转向渐进式输入、触摸优先策略、死区处理、变化检测避免冗余回调
- **UI 组件视觉风格统一**：霓虹风格配色一致，CSS 动画注入避免外部依赖
- **音效系统合成方案巧妙**：无需音频文件，全部通过 Web Audio API 实时合成

### 审查结论
代码整体质量良好，模块架构清晰，接口设计合理。但存在 4 个 BLOCKER 级问题必须修复后才能进入测试：
1. **赛道名称不匹配**导致游戏完全无法运行
2. **漂移事件未发射**导致漂移音效缺失
3. **CheckpointSystem 未集成**导致圈数和比赛完成功能失效
4. **音乐振荡器泄漏**导致内存泄漏和音频叠加

建议优先修复 #1（赛道名称），这是最基础的阻塞问题。

---

## 🔍 第1轮复审（BLOCKER 修复验证）

### 复审结论
**✅ 修复通过** — 4 个 BLOCKER 全部修复到位，代码已提交

### BLOCKER 修复验证结果

| # | 问题 | 修复 Developer | 验证结果 | 说明 |
|---|------|---------------|---------|------|
| 1 | **赛道名称不匹配** | Dev-5 + Dev-7 | ✅ 通过 | TrackLoader 别名映射('circuit'→'motor-speedway') + Menu.js 改为 'motor-speedway' 选项，双重修复无冲突 |
| 2 | **漂移事件未发射** | Dev-2 + Dev-1 | ✅ 通过 | PhysicsEngine.consumeDriftEvents() 已实现；GameLoop _tick() 中直接检测漂移状态变化并发射 EventBus 事件，链路完整 |
| 3 | **CheckpointSystem 未集成** | Dev-1 | ✅ 通过 | main.js 实例化 + GameLoop onExit('menu') 中 init+registerCar + _tick() 每帧 update() + 三个回调连接 EventBus |
| 4 | **音乐振荡器泄漏** | Dev-6 | ✅ 通过 | _stopMusic() 正确 stop()+disconnect() 所有振荡器；playMusic() 每次先停止旧音乐再播放新音乐 |

### 详细验证

#### BLOCKER #1: 赛道名称不匹配
- **TrackLoader.js L39**: `registerAlias('circuit', 'motor-speedway')` ✅
- **TrackLoader.js L86-92**: `loadTrack()` 先解析别名再查找 ✅
- **Menu.js L44-46**: `_tracks` 改为仅 `'motor-speedway'` 一条 ✅
- **GameLoop.js L103-112**: 回退逻辑兜底 ✅
- **结论**: 双重修复，无冲突。Menu.js 直接提供正确赛道名，TrackLoader 别名映射作为向后兼容。

#### BLOCKER #2: 漂移事件未发射
- **PhysicsEngine.js L151**: `_driftEvents = []` 事件队列 ✅
- **PhysicsEngine.js L270-280**: `updateCar()` 检测漂移状态变化并记录 ✅
- **PhysicsEngine.js L460-464**: `consumeDriftEvents()` 返回并清空 ✅
- **GameLoop.js L366-376**: 直接检测 `carAfter.isDrifting !== _prevDrifting` 并发射 EventBus ✅
- **GameLoop.js L220-222**: EventBus 监听 → `audio.playDrift()` ✅
- **事件链路**: PhysicsEngine → GameLoop → EventBus → AudioManager ✅
- **注意**: GameLoop 未调用 `consumeDriftEvents()`，PhysicsEngine 的 `_driftEvents` 成为死代码（降级为 INFO），但功能完全正确。

#### BLOCKER #3: CheckpointSystem 未集成
- **main.js L23**: 导入 CheckpointSystem ✅
- **main.js L55**: 实例化 `new CheckpointSystem()` ✅
- **main.js L82**: 通过 deps 注入 GameLoop ✅
- **GameLoop.js L126-127**: `onExit('menu')` 中 init + registerCar ✅
- **GameLoop.js L358-363**: `_tick()` 每帧 update() ✅
- **GameLoop.js L229-242**: 三个回调连接 EventBus ✅
- **GameLoop.js L417**: HUD 使用 `checkpoints.getLap()` ✅

#### BLOCKER #4: 音乐振荡器泄漏
- **AudioManager.js L415-444**: `_stopMusic()` 遍历振荡器 stop()+disconnect() ✅
- **AudioManager.js L229-241**: `playMusic()` 先 `_stopMusic()` 再 `_startAmbient()` ✅
- **AudioManager.js L247-249**: `stopMusic()` 公共方法 ✅
- **验证**: 切换音乐时旧振荡器被正确清理，无泄漏。

### 遗留 WARNING（不阻塞测试）

| # | 问题 | 严重度 | 责任 Developer | 说明 |
|---|------|--------|---------------|------|
| W1 | 暂停键映射不一致 | WARNING | Dev-4 / Dev-7 | Menu.js 显示 "ESC = Pause" 但 Keyboard.js 映射 KeyP |
| W3 | 转向回正速率可能过慢 | WARNING | Dev-4 | rampDown 8.0/s 可增至 12.0/s |
| W5 | angularVelocity 缺少上限钳制 | WARNING | Dev-2 | 碰撞后角速度可能过大 |

### 审查结论
4 个 BLOCKER 级问题均已修复到位，事件链路完整，模块集成正确。代码质量良好，可以进入测试阶段。遗留的 3 个 WARNING 不阻塞测试流程，建议在测试阶段一并修复。

---

## 🧪 第1轮测试
<!-- 测试员：精简通过/失败和 Bug 列表 -->

---

## 📊 Agent 状态（历史）

### 当前轮次 Agent

| Agent | 角色 | 状态 | 最后活动 |
|-------|------|------|---------|
| - | - | 待启动 | - |

---

## 📋 轮次总结

### 踩过的坑
<!-- PM 在轮次结束时总结 -->

### 项目规范
<!-- PM 在轮次结束时总结 -->

### 学习成果
<!-- PM 在轮次结束时总结 -->
