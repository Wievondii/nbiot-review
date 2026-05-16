# Dev-7 工作日志 - UI系统

> **模块**：UI系统
> **文件范围**：`src/ui/HUD.js`, `src/ui/Menu.js`, `src/ui/Countdown.js`, `src/ui/index.js`

## 开发状态
已完成

## 任务进度
- [x] 实现 HUD（速度表、圈数、计时器）— `src/ui/HUD.js`
- [x] 实现开始菜单（标题、开始按钮、赛道选择、操作说明）— `src/ui/Menu.js`
- [x] 实现倒计时系统（3-2-1-GO! 动画）— `src/ui/Countdown.js`
- [x] 导出模块接口 — `src/ui/index.js`

## 变更文件清单

| 文件 | 说明 |
|------|------|
| `src/ui/HUD.js` | 新增 - 实时 HUD（速度数字+进度条、圈数、计时器 MM:SS.ms、漂移指示器） |
| `src/ui/Menu.js` | 新增 - 开始菜单（霓虹风格标题、3个赛道选择、开始按钮、操作说明） |
| `src/ui/Countdown.js` | 新增 - 3-2-1-GO! 倒计时（放大+淡入淡出动画） |
| `src/ui/index.js` | 新增 - 统一导出 HUD, Menu, Countdown |

## 接口实现状态

| 接口方法 | 状态 | 说明 |
|---------|------|------|
| `HUD.update(data)` | ✅ | 每帧更新速度/圈数/计时/漂移状态 |
| `HUD.mount()` | ✅ | 挂载 HUD DOM 到容器 |
| `HUD.unmount()` | ✅ | 移除 HUD DOM |
| `Menu.show(options)` | ✅ | 显示开始菜单（含 onStart, onTrackSelect 回调） |
| `Menu.hide()` | ✅ | 隐藏菜单 |
| `Countdown.start(onComplete)` | ✅ | 开始倒计时，完成后触发回调 |
| `Countdown.stop()` | ✅ | 停止并清理倒计时 |

## 验收自查

### 功能完整性
- [x] **HUD 速度表**：大号数字(kph) + 底部进度条，速度超 120 变黄、超 200 变红
- [x] **HUD 圈数**：右上角显示当前圈数/总圈数（如 "1 / 3"）
- [x] **HUD 计时器**：右上角显示 MM:SS.ms 格式
- [x] **HUD 漂移指示器**：中央偏下 "🔥 DRIFT!" 霓虹闪烁，漂移时可见
- [x] **菜单标题**：大号 "NEON DRIFT" 脉冲动画 + 副标题
- [x] **开始按钮**：绿色霓虹边框，hover 高亮，点击缩放反馈
- [x] **赛道选择**：3条赛道（Circuit City / Mountain Pass / Desert Storm），点击切换选中态
- [x] **操作说明**：6组快捷键键位提示网格
- [x] **倒计时 3-2-1-GO!**：每个数字缩放入场动画，GO! 额外脉冲闪烁，完成后自动清理
- [x] **模块导出**：index.js 统一导出三个类

### 设计规范
- [x] **深色主题**：背景 `rgba(8, 8, 20, 0.95)`
- [x] **霓虹色高亮**：青色 `#00f0ff`、品红 `#ff00e4`、黄色 `#ffd700`、绿色 `#00ff88`
- [x] **DOM 覆盖 Canvas**：所有 UI 使用 `position: absolute` 覆盖
- [x] **响应式**：使用 `clamp()` 和相对单位适配不同屏幕
- [x] **代码风格**：ES6+ 模块、PascalCase 类名、JSDoc 注释

### 集成要点
- [x] `updateHUD(data)` 调用路径：GameLoop 每帧调用 `hudInstance.update(data)`
- [x] 数据格式：`{ speed, lap, totalLaps, elapsedTime, isDrifting }`
- [x] 菜单回调：`onStart()` 和 `onTrackSelect(trackId)` 供 GameLoop 绑定
- [x] 倒计时完成回调：`onComplete()` 通知 GameLoop 开始比赛

## 修复记录

### Blocker #1：赛道名称不匹配
- **错误类型**：A. 模块内错误
- **原因分析**：Menu.js 的 `_tracks` 数组写死了三个虚构赛道 ID (`circuit`/`mountain`/`desert`)，而 TrackLoader 只注册了 `'motor-speedway'` 一个赛道。点击"开始比赛"时 `onTrackSelect('circuit')` 传给 TrackLoader 会找不到赛道。
- **改动内容**：`src/ui/Menu.js` 第 40-44 行，将赛道列表替换为和 TrackData.js 注册的 key 一致的一条赛道：`{ id: 'motor-speedway', name: 'Motor Speedway', difficulty: 'Medium' }`
- **关键代码行**：
  ```js
  this._tracks = [
    { id: 'motor-speedway', name: 'Motor Speedway', difficulty: 'Medium' },
  ];
  ```
- **验证方法**：点击开始按钮后，`onTrackSelect` 传递的 `trackId` 为 `'motor-speedway'`，与 `TrackLoader.loadTrack('motor-speedway')` 匹配。

## 备注
- HUD 使用 DOM 元素而非 Canvas 绘制，以保持高清晰度和字体渲染质量
- 速度条最大刻度 300 km/h，超过时进度条满格
- 所有 UI 组件都是"无状态"视图层，数据由 GameLoop 通过方法参数注入
- 倒计时动画使用 CSS transition + cubic-bezier 实现弹性效果
- 赛道数据必须与 TrackLoader 注册的赛道标识符保持一致
