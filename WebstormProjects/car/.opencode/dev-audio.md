# Dev-6 工作日志 - 音效系统

> **模块**：音效系统
> **文件范围**：`src/audio/AudioManager.js`, `src/audio/SoundPool.js`, `src/audio/index.js`

## 开发状态
已完成

## 任务进度
- [x] 实现 AudioManager 核心音频管理
- [x] 实现 SoundPool 声音池（复用音频实例）
- [x] 实现引擎音效（随速度变化）
- [x] 实现漂移音效、碰撞音效
- [x] 实现倒计时音效
- [x] 实现完成圈数音效
- [x] 实现背景音乐（合成环境音）
- [x] 导出模块接口

## 变更文件清单
- `src/audio/SoundPool.js`（新增）— 声音池，管理 GainNode 池的 acquire/release，支持声音复用和自动回收
- `src/audio/AudioManager.js`（新增）— 核心音频管理器，实现 AudioManager 接口全部方法
- `src/audio/index.js`（新增）— 模块统一导出

## 接口实现状态

| 接口方法 | 状态 | 说明 |
|---------|------|------|
| `init()` | ✅ | 创建 AudioContext、主音量、引擎振荡器、声音池 |
| `playEngine(speed)` | ✅ | 双振荡器，sawtooth+square，频率 60~200Hz 随速度变化 |
| `playDrift()` | ✅ | 白噪声 + 带通滤波，带去重防止叠加 |
| `playCollision()` | ✅ | 白噪声 + 低通滤波，短促冲击声 |
| `playCountdown()` | ✅ | 4 个 beep：C5 @0s / C5 @1s / C5 @2s / C6 @3s(GO!) |
| `playLapComplete(lap)` | ✅ | C5→E5→G5 上行琶音 |
| `playMusic(track)` | ✅ | 'menu'=A3 sine / 'race'=A2 triangle 环境音 |
| `setVolume(volume)` | ✅ | 主 GainNode 控制，范围[0,1] |

## 验收自查
- [x] ✅ 所有接口方法均已实现，签名与共享日志中 `AudioManager` 接口一致
- [x] ✅ SoundPool 支持 acquire/release 模式，超限自动回收最早活跃实例
- [x] ✅ 引擎音效频率和音量随 speed 参数连续变化
- [x] ✅ 漂移音效使用白噪声+滤波，带去重（`_driftPlaying` 标志）
- [x] ✅ 碰撞音效为短促低频冲击声
- [x] ✅ 倒计时音效使用 setTimeout 序列（3-2-1-GO）
- [x] ✅ 完成圈数为上升琶音（C5-E5-G5）
- [x] ✅ 背景音乐为振荡器合成的环境音
- [x] ✅ 音量控制 clamp 到 [0,1]，即时生效
- [x] ✅ 自动播放策略处理（`_ensureContext` 恢复 AudioContext）
- [x] ✅ 不支持 Web Audio API 的浏览器静默失败
- [x] ✅ index.js 统一导出 AudioManager 和 SoundPool

## 修复记录

### Bug #4：音乐振荡器泄漏
- **错误类型**：A. 模块内错误
- **原因分析**：`playMusic()` 中使用 `this._musicPlaying` guard 防止重复播放，导致旧振荡器从未被停止或断开。多次调用或切换曲目时，旧振荡器持续运行造成内存泄漏和音频叠加。
- **改动内容**：
  1. 新增 `_stopMusic()` 内部方法 — 遍历 `_musicOscs` 逐个调用 `stop()` + `disconnect()`，断开 `_musicGain`，重置状态
  2. 修改 `playMusic(track)` — 移除 `this._musicPlaying` 守卫，改为每次调用先执行 `_stopMusic()` 再启动新曲目
  3. 新增 `stopMusic()` 公共方法 — 供外部调用者显式停止背景音乐
- **关键代码行**：
  - `_stopMusic()` 第 415~444 行：遍历振荡器 `stop()` + `disconnect()`，断开 GainNode，标志置 false
  - `playMusic()` 第 229~241 行：移除 `this._musicPlaying` guard，改为先 `_stopMusic()` 再 `_startAmbient()`
- **验证方法**：`stopMusic` 和 `_stopMusic` 均存在于原型上，语法检查通过

## 备注
- 所有音效通过 Web Audio API 实时合成，无需任何音频文件
- 引擎使用 sawtooth + square 双振荡器叠加制造粗糙感
- 漂移/碰撞使用随机白噪声 AudioBuffer + BiquadFilter 滤波
- 声音池最大并发数为 8，超限时回收最早活跃通道
- `playDrift()` 具有去重保护，防止同一帧内多次触发叠加
- `_playBeep` 通过 constructor 中 `.bind(this)` 确保 setTimeout 回调正确
