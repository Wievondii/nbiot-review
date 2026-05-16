# Dev-2 工作日志 - 物理引擎

> **模块**：物理引擎
> **文件范围**：`src/physics/PhysicsEngine.js`, `src/physics/Collision.js`, `src/physics/Drift.js`, `src/physics/index.js`

## 开发状态
已完成

## 任务进度
- [x] 实现 PhysicsEngine 核心更新逻辑（固定步长 accumulator + 半隐式欧拉积分）
- [x] 实现赛车力应用（油门、刹车、转向扭矩）
- [x] 实现碰撞检测系统（SAT 多边形碰撞 + 空间网格优化）
- [x] 实现赛车 vs 赛道边界碰撞
- [x] 实现赛车 vs 赛车碰撞
- [x] 实现漂移物理（触发/维持/结束，参数可配置）
- [x] 实现漂移时侧向摩擦力降低 + 转向灵敏度提高
- [x] 实现 getCarState 方法返回 CarEntity 兼容状态
- [x] 导出模块接口

## 变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/physics/PhysicsEngine.js` | 新增 | 核心物理引擎，固定步长更新（1/60s），力/扭矩应用，碰撞检测入口 |
| `src/physics/Collision.js` | 新增 | 碰撞检测系统，SAT算法，SpatialGrid空间分区优化 |
| `src/physics/Drift.js` | 新增 | 漂移物理，可配置参数，触发/维持/结束逻辑 |
| `src/physics/index.js` | 新增 | 模块统一导出 |

## 接口实现状态

| 接口 | 状态 |
|------|------|
| `PhysicsEngine.update(dt, inputState)` | ✅ |
| `PhysicsEngine.applyForce(carId, force)` | ✅ |
| `PhysicsEngine.applyTorque(carId, torque)` | ✅ |
| `PhysicsEngine.checkCollisions()` → CollisionEvent[] | ✅ |
| `PhysicsEngine.getCarState(carId)` → CarEntity | ✅ |
| `CarEntity` 全字段 (id/pos/vel/angle/angVel/speed/isDrifting/lap/checkpoint) | ✅ |
| `DRIFT_PARAMS` 可配置常量 | ✅ |
| `SpatialGrid` 空间分割 | ✅ |

## 设计决策

### 1. inputState 作为参数传递
物理引擎不直接引用 InputController，而是接受 GameLoop 传入的 inputState。这遵循"禁止直接引用其他模块实例"的约束。

### 2. 碰撞响应直接在引擎内处理
checkCollisions() 同时检测碰撞并应用响应（位置修正 + 速度反弹），返回的 events 供其他模块（音效、UI）使用。

### 3. 半隐式欧拉积分
先用力的累加器更新速度，再用新速度更新位置。这比显式欧拉更稳定。

### 4. 坐标系
Y轴向上为正，X轴向右为正。角度弧度制，0度指向X正方向，逆时针为正。Collision.js 的 getCarVertices 保持一致。

## 验收自查
- [x] 代码语法正确（纯 ES6 模块语法，无 TypeScript 错误）
- [x] 接口方法完整，遵循 Planner 定义的 PhysicsEngine 接口
- [x] 固定步长 accumulator 模式（FIXED_DT = 1/60, MAX_ACCUMULATOR = 0.1）
- [x] 漂移参数全部提取为 DRIFT_PARAMS 可配置常量
- [x] 碰撞检测使用 SpatialGrid 空间分割优化
- [ ] 通知调用方可正确调用（需 Dev-1 GameLoop 集成验证）
- [ ] CollisionEvent[] 可被音频模块使用（需 Dev-6 集成验证）

## 给测试员的提示
- 物理引擎还未集成到游戏循环，需要 Dev-1 创建 GameLoop 后才能完整测试
- 测试时注意 inputState 的格式：{ throttle: 0-1, brake: 0-1, steer: -1~1, drift: boolean }
- init() 需要 carConfigs [{ id, position, angle? }] 和 barriers [{ points: [] }]
- SAT 要求边界的 points 是凸多边形顶点数组
- 空间网格 cellSize=20m，适用于中小型赛道

## 修复记录

### Bug #1（审查BLOCKER #2）：漂移事件未发射
- **错误类型**：A. 模块内错误
- **原因分析**：`updateCar()` 中更新了 `car.isDrifting`，但没有将漂移状态变化通知给其他模块（尤其是音频模块需要知道漂移开始/结束来播放音效）
- **改动内容**：
  1. `constructor()`: 新增 `this._driftEvents = []` 漂移事件队列
  2. `init()`/`reset()`: 清空事件队列
  3. `updateCar()`: 在 `updateDriftState()` 前后对比 `wasDrifting`，状态变化时 push `{ type, carId }` 到事件队列
  4. 新增 `consumeDriftEvents()`: 返回并清空事件队列，供 GameLoop 消费后通过 EventBus 发射
- **关键设计决策**：PhysicsEngine **不直接引用 EventBus**（遵循"禁止直接引用其他模块实例"约束），而是提供 `consumeDriftEvents()` 返回值让 GameLoop 来发射事件
- **调用方式**（由 Dev-1 GameLoop 实现）：
  ```javascript
  // 在 physics.update() 之后调用
  const driftEvents = physics.consumeDriftEvents();
  for (const evt of driftEvents) {
    if (evt.type === 'drift_start') {
      eventBus.emit('drift_start', { carId: evt.carId });
    } else {
      eventBus.emit('drift_end', { carId: evt.carId });
    }
  }
  ```

### Bug #2（🟡一般 测试发现）：_driftEvents 死代码/内存泄漏
- **错误类型**：A. 模块内错误
- **原因分析**：PhysicsEngine 实现了 `consumeDriftEvents()` 方法和 `_driftEvents` 数组，但 GameLoop 从未调用它（改用直接检测 `isDrifting` 状态）。导致死代码和持续 push 造成的内存泄漏。
- **改动内容**：完全移除 `_driftEvents` 机制
  1. `constructor()`: 移除 `this._driftEvents = []`
  2. `init()`/`reset()`: 移除 `this._driftEvents = []`
  3. `updateCar()`: 移除 `wasDrifting` 对比和 `_driftEvents.push()` 逻辑
  4. 整体移除 `consumeDriftEvents()` 方法
- **效果**：文件从 567 行减少到 548 行，消除了死代码和内存泄漏源

### Bug #5（🟢轻微 测试发现）：angularVelocity 缺少上限钳制
- **错误类型**：A. 模块内错误
- **原因分析**：`angularVelocity` 没有上限，持续输入扭矩且被阻尼不足时，角速度可能无限增大导致数值爆炸（NaN 或异常旋转）
- **改动内容**：
  1. 新增常量 `MAX_ANGULAR_VELOCITY = 10`（弧度/秒，约 1.6 圈/秒）(L77)
  2. 角速度阻尼后添加 `clamp(val, -MAX, MAX)` 钳制 (L329-334)
  3. 新增 `clamp()` 工具函数 (L546-548)
- **安全边界**：10 rad/s ≈ 573°/s，正常驾驶时角速度通常 < 3 rad/s，此上限仅防止极端情况

## 备注
- PhysicsEngine 不直接依赖 InputController / AudioManager / EventBus，通过参数和返回值与外部通信
- `lap` 和 `checkpoint` 由外部（TrackManager）通过 setCarLap / setCarCheckpoint 设置
- 碰撞产生的 CollisionEvent 有 extra 字段 `collision` = SAT 结果 { overlap, normal, contactPoint }，供调试用
