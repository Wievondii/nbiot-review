# Dev-4 工作日志 - 输入控制

> **模块**：输入控制
> **文件范围**：`src/input/Keyboard.js`, `src/input/Touch.js`, `src/input/InputMapper.js`, `src/input/index.js`

## 开发状态
已完成

## 任务进度
- [x] 实现键盘输入（WASD/方向键）
- [x] 实现触摸输入（移动端虚拟摇杆 + 按钮）
- [x] 实现输入映射器（原始输入 → 平滑 InputState）
- [x] 导出模块接口（index.js）

## 变更文件清单

| 文件 | 说明 |
|------|------|
| `src/input/Keyboard.js` | 键盘输入模块 - 按键状态追踪，WASD/方向键/空格/P 映射 |
| `src/input/Touch.js` | 触摸输入模块 - 左侧虚拟摇杆（转向）+ 右侧按钮（油门/刹车/漂移） |
| `src/input/InputMapper.js` | 输入映射器 - 实现 InputController 接口，聚合键盘+触摸，平滑转向，触发 onAction 回调 |
| `src/input/index.js` | 入口导出文件 |

## 接口实现状态

| 接口 | 状态 | 说明 |
|------|------|------|
| `InputController.getState()` | ✅ | 返回当前帧平滑后的 InputState |
| `InputController.onAction(action, callback)` | ✅ | 支持 throttle/brake/steer/drift/pause |
| `InputState` | ✅ | 各字段类型、范围符合规范 |

## 验收自查
- [x] ✅ **WASD 键映射**：W=油门, S=刹车, A=左转, D=右转
- [x] ✅ **方向键支持**：↑=油门, ↓=刹车, ←=左转, →=右转
- [x] ✅ **空格键 = 漂移，P键 = 暂停**
- [x] ✅ **按键组合**：支持同时按多个键（KeyboardInput 使用 Set 追踪）
- [x] ✅ **虚拟摇杆转向**：Pointer Events，死区 18%，一阶低通滤波平滑
- [x] ✅ **右侧按钮**：油门 + 刹车 + 漂移，视觉反馈（active 态放大/变色）
- [x] ✅ **转向渐进输入**：键盘 200ms 渐进至满舵，125ms 回正；触摸连续模拟值
- [x] ✅ **死区处理**：摇杆中心 18% 死区，死区外重新映射到 0~1
- [x] ✅ **InputController 接口**：getState() 和 onAction() 均已实现
- [x] ✅ **输入平滑**：转向采用 dt 时间步长的一阶平滑，避免抖动
- [x] ✅ **状态变化检测**：仅当值变化时触发回调，避免不必要的调用
- [x] ✅ **暂停为瞬态（toggle）**：仅在按下时触发一次回调，不在释放时重复触发
- [x] ✅ **导出模块接口**：index.js 统一导出 KeyboardInput/TouchInput/InputMapper

## 接口调用关系确认

| 被调接口 | 调用方 | 调用时机 | 实现位置 |
|---------|--------|---------|---------|
| `getState()` | Dev-2 (Physics) | 每帧读取输入 | InputMapper.getState() |
| `onAction()` | Dev-2 (Physics) | 注册回调 | InputMapper.onAction() |
| 回调内 → applyForce/applyTorque | Dev-4 → Dev-2 | 状态变化时 | _fireCallbacks → 用户注册的回调 |

## 关键设计决策

1. **转向渐进式输入**：键盘的转向键产生离散值（-1/0/1），InputMapper 使用基于 dt 的一阶平滑（升 5.0/s，降 8.0/s）转换为连续模拟值
2. **触摸优先策略**：当触摸摇杆活跃时，转向值优先使用触摸的模拟信号；键盘信号仅在摇杆未激活时接管
3. **暂停是瞬态动作**：pulse 模式（只按 press，不按 release），适合 GameLoop toggle 暂停
4. **样式内联注入**：Touch.js 通过 `<style>` 注入 CSS，无需外部样式表依赖
5. **错误隔离**：onAction 回调用 try-catch 包裹，避免单模块异常影响整个输入系统

## 修复记录

### Bug #3（🟡一般）: 暂停键映射不一致
- **错误类型**：A. 模块内错误
- **原因分析**：最初设计使用 P 键做暂停，但 Menu.js 的操作说明展示为 ESC 键
- **改动内容**：
  - `src/input/Keyboard.js` 第4行注释：`P 键` → `ESC 键`
  - `src/input/Keyboard.js` 第21行映射表：`KeyP: 'pause'` → `Escape: 'pause'`
  - `src/input/Keyboard.js` 第141~145行方法：`isJustPressed('KeyP')` → `isJustPressed('Escape')`
- **关键代码行**：`Escape: 'pause'`（第21行）
- **验证方法**：按下 ESC 键应触发 pause 回调，P 键不再触发暂停

### Bug #6（🟢轻微）: Touch.js 模块级样式注入
- **错误类型**：A. 模块内错误
- **原因分析**：CSS 样式在模块顶层通过 `document.head.appendChild(STYLES)` 直接注入，无论 TouchInput 是否被初始化都会执行，桌面端造成无谓开销
- **改动内容**：
  - `src/input/Touch.js` 删除模块顶层的 `<style>` 创建和注入代码
  - 将样式保留为纯字符串常量 `TOUCH_STYLES`
  - 新增私有的 `_injectStyles()` 方法，使用 `TouchInput._stylesInjected` 静态标志保证全局仅注入一次
  - 在 `init()` 方法中调用 `this._injectStyles()`
- **关键代码行**：`_injectStyles()` 方法（第197~203行）
- **验证方法**：在桌面端（无触摸设备）import Touch.js 不应注入样式；在移动端初始化 TouchInput 时注入一次

## 备注

### 调用方注意
- `InputMapper` 的 `init(container)` 需要传入一个 DOM 容器用于挂载触摸控件（如果不需要触摸可以传 null/undefined）
- `getState()` 每次调用即推进一帧（内部会清理瞬态状态），因此一帧内应该只调用一次
- `getState()` 返回的是防篡改副本（浅拷贝），修改返回值不会影响内部状态
- 暂停回调（'pause'）是瞬态的——只在按下 ESC 键的帧触发一次，适合做 toggle 切换
- 若在桌面端开发，可以通过 Chrome DevTools 的 Device Mode 模拟触摸来测试触摸控件

### 依赖关系
- 无外部依赖（纯 Vanilla JS）
- 通过 import 引用其他模块接口（类型定义在 types.js 中，由 Dev-1 提供）
