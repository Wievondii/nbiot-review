# Dev-5 工作日志 - 赛道系统

> **模块**：赛道系统
> **文件范围**：`src/track/TrackLoader.js`, `src/track/TrackData.js`, `src/track/Checkpoint.js`, `src/track/index.js`

## 开发状态
已完成

---

## 🔧 修复记录

### BLOCKER #1：赛道名称不匹配
- **错误类型**：A. 模块内错误
- **原因分析**：UI 菜单（Menu.js）提供赛道选择项 `'circuit'` / `'mountain'` / `'desert'`，但 TrackLoader 只注册了 `'motor-speedway'`，导致 `loadTrack('circuit')` 返回 null，游戏无法初始化
- **改动内容**：`src/track/TrackLoader.js`
  - 新增 `_aliases` 别名映射表（`Map<string, string>`）
  - 新增 `registerAlias(alias, target)` 方法
  - 在 `_registerDefaults()` 中注册别名 `'circuit' → 'motor-speedway'`
  - `loadTrack(name)` 先尝试别名解析，再搜索实际赛道名
  - 新增 `getTrackAliases()` 和 `hasTrack(name)` 查询方法
  - `reset()` / `destroy()` 同步清理别名映射
- **关键代码行**：
  - `loadTrack()` 第87-92行：别名解析逻辑
  - `_registerDefaults()` 第38-39行：注册 `'circuit'` 别名
- **验证方法**：
  - `loader.loadTrack('circuit')` → 成功返回 Motor Speedway 赛道数据
  - `loader.getCurrentTrackName()` → `'circuit'`
  - `loader.hasTrack('circuit')` → `true`
  - `loader.loadTrack('mountain')` → 返回 `null`（不崩溃）

---

## 任务进度
- [x] 实现赛道数据定义（TrackData.js）
- [x] 实现赛道加载器（TrackLoader.js）
- [x] 实现检查点系统（Checkpoint.js）
- [x] 导出模块接口（index.js）
- [x] 🔧 修复 BLOCKER #1：赛道名别名映射

## 变更文件清单

| 文件 | 说明 |
|------|------|
| `src/track/TrackData.js` | 赛道数据定义：椭圆形默认赛道"Motor Speedway"（8 个检查点、外壁+内壁共 2 个碰撞多边形、起点位置/朝向、3 圈）、赛道验证函数 |
| `src/track/TrackLoader.js` | 赛道加载器：从名称/JSON 加载、数据完整性校验、多赛道注册与切换、赛道变更回调、**别名映射系统** |
| `src/track/Checkpoint.js` | 检查点系统：线段相交检测、按顺序强制通过（防作弊）、圈数记录、完成事件回调 |
| `src/track/index.js` | 模块统一导出接口 |

## 接口实现状态

| 接口 | 状态 |
|------|------|
| TrackLoader.loadTrack(name) | ✅ 支持别名解析 |
| TrackLoader.registerTrack(name, data) | ✅ |
| TrackLoader.registerAlias(alias, target) | ✅ 新增 |
| TrackLoader.loadFromJSON(json) | ✅ |
| TrackLoader.getCurrentTrack() | ✅ |
| TrackLoader.getCurrentTrackName() | ✅ |
| TrackLoader.getTrackNames() | ✅ |
| TrackLoader.getTrackAliases() | ✅ 新增 |
| TrackLoader.hasTrack(name) | ✅ 新增 |
| CheckpointSystem.init(trackData) | ✅ |
| CheckpointSystem.registerCar(carId) | ✅ |
| CheckpointSystem.update(carId, pos, prevPos) | ✅ |
| CheckpointSystem.onCheckpointPassed(cb) | ✅ |
| CheckpointSystem.onLapComplete(cb) | ✅ |
| CheckpointSystem.onRaceComplete(cb) | ✅ |
| CheckpointSystem.getLap(carId) | ✅ |
| CheckpointSystem.getNextCheckpoint(carId) | ✅ |
| CheckpointSystem.getProgress(carId) | ✅ |
| CheckpointSystem.isRaceComplete(carId) | ✅ |
| validateTrackData(data) | ✅ |

## 验收自查
- [x] ✅ 定义了默认椭圆形赛道（8 检查点、内外壁碰撞边界、起点位置/朝向、3 圈）
- [x] ✅ 赛道加载器支持从名称和 JSON 加载、数据校验、多赛道切换
- [x] ✅ 检查点使用线段相交检测，精确判断通过
- [x] ✅ 防作弊：必须按顺序通过检查点，跳过不触发
- [x] ✅ 圈数记录和比赛完成事件正确触发
- [x] ✅ 🔧 BLOCKER #1 已修复：`'circuit'` 别名 → `'motor-speedway'`

## 备注意见
- `'mountain'` / `'desert'` 未注册时 `loadTrack` 返回 `null`，不会崩溃，符合设计预期
- 未来如需添加山地/沙漠赛道，只需定义新赛道数据并注册，或注册新别名
