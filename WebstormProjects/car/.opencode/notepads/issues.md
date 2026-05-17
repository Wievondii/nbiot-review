# 测试问题记录

## 2026-05-16 第3轮测试（第3次验证）

### Bug #1：RenderEngine3D.render() 签名与 GameLoop 调用不匹配（BLOCKER）

**错误类型：** B. 多模块协调错误

**现象：**
- 游戏加载时立即报错 `Cannot read properties of null (reading 'isCamera')`
- 页面显示错误信息，所有功能不可用

**原因：**
- `GameLoop._tick()` 第471行调用 `this.render.render(allCars, trackData, this.state.current)`
- 但 `RenderEngine3D.render()` 方法签名为 `render(scene, camera)`
- `trackData`（可能为 null）被当作 `camera` 参数传入 Three.js
- Three.js 内部检查 `camera.isCamera` 时抛出错误

**责任 Developer：** Dev-1（GameLoop）/ Dev-3（RenderEngine3D）

**处置：**
- B. 多模块协调错误 → 返回 Planner 重新规划渲染接口

---

### Bug #2：SceneBuilder 从未被使用，场景和摄像机为 null（BLOCKER）

**错误类型：** B. 多模块协调错误

**现象：**
- `renderEngine.scene` 和 `renderEngine.camera` 始终为 null
- 3D 场景从未被创建

**原因：**
- `main.js` 中没有导入 `SceneBuilder`
- 没有调用 `sceneBuilder.createScene()` 创建场景
- 没有调用 `renderEngine.setScene()` 和 `renderEngine.setCamera()` 设置引用
- `RenderEngine3D.init()` 只创建了 renderer，没有创建 scene 和 camera

**责任 Developer：** Dev-1（集成负责人）

**处置：**
- B. 多模块协调错误 → 返回 Planner 重新规划集成顺序

---

### Bug #3：赛道名称不匹配导致加载失败

**错误类型：** B. 多模块协调错误

**现象：**
- 控制台警告 `未找到赛道: "motor-speedway"，可用赛道: [motor-speedway-3d]`
- 赛道加载返回 null

**原因：**
- `main.js` 第160行使用 `'motor-speedway'` 加载赛道
- `TrackData3D.js` 中注册的赛道名称为 `'motor-speedway-3d'`
- `Menu3D.js` 第31行也使用 `'motor-speedway'`
- 名称不一致

**责任 Developer：** Dev-1（main.js）/ Dev-5（TrackData3D）/ Dev-7（Menu3D）

**处置：**
- B. 多模块协调错误 → 返回 Planner 统一赛道命名

---

### Bug #4：TrackLoader 返回 null 后未做错误处理

**错误类型：** A. 模块内错误

**现象：**
- `trackLoader.loadTrack('motor-speedway')` 返回 null
- `main.js` 没有检查返回值，继续执行后续代码

**原因：**
- 缺少错误处理逻辑

**责任 Developer：** Dev-1

**处置：**
- A. 模块内错误 → 返回 Dev-1 修复

---

## 2026-05-17 第5轮审查（渲染管线修复验证）

### Bug #5：GameLoop 回退赛道名称不匹配（BLOCKER）

**错误类型：** B. 多模块协调错误

**现象：**
- GameLoop menu onExit 回调中回退赛道名称为 `'motor-speedway'`（不带 `-3d`）
- TrackData3D 注册的赛道名称为 `'motor-speedway-3d'`
- 如果 UI 未提供赛道名或首次加载失败，回退逻辑将永远找不到赛道

**原因：**
- `GameLoop.js` 第119行和第125行使用 `'motor-speedway'` 作为回退名称
- 与 TrackData3D 注册的 `'motor-speedway-3d'` 不匹配

**位置：**
- `src/core/GameLoop.js` 第119行：`'motor-speedway'`
- `src/core/GameLoop.js` 第125行：`'motor-speedway'`

**建议修复：**
- 将两处 `'motor-speedway'` 改为 `'motor-speedway-3d'`

**责任 Developer：** Dev-1

**处置：**
- B. 多模块协调错误 → 返回 Dev-1 修复

---

### Bug #6：TrackLoader 错误处理回退逻辑无效（WARNING）

**错误类型：** A. 模块内错误

**现象：**
- `main.js` 第160-164行检查赛道加载失败后，再次调用 `trackLoader.loadTrack('motor-speedway-3d')`
- 如果第一次返回 null，第二次也会返回 null（同一赛道名）
- 游戏仍会继续启动，后续可能因 `trackData` 为 null 而崩溃

**原因：**
- 回退逻辑使用了与首次加载相同的赛道名称
- 未阻止游戏启动或显示错误 UI

**位置：**
- `main.js` 第160-164行

**建议修复：**
- 方案A：赛道加载失败时显示错误 UI 并阻止游戏启动
- 方案B：加载硬编码的默认赛道数据作为回退
- 方案C：移除无效的回退调用，改为抛出错误或显示警告

**责任 Developer：** Dev-1

**处置：**
- A. 模块内错误 → 返回 Dev-1 修复

---

## 2026-05-17 第7轮审查

### INFO #1：index.html 中 `#gameCanvas` CSS 规则成为死代码

**错误类型：** A. 模块内错误

**现象：**
- `index.html` 第38-42行定义了 `#gameCanvas { display: block; width: 100%; height: 100%; }` 样式
- 但 `<canvas id="gameCanvas">` 元素已在第7轮删除
- RenderEngine3D 动态创建的 canvas 没有 id 属性，不匹配此选择器

**原因：**
- 删除 HTML canvas 元素时未同步清理对应的 CSS 规则
- RenderEngine3D.init() 通过内联样式（`style.width/height/display`）设置 canvas 样式，不依赖此 CSS

**位置：**
- `index.html` 第38-42行

**建议修复：**
- 删除 `#gameCanvas` CSS 规则（第38-42行）

**责任 Developer：** Dev-1

**处置：**
- A. 模块内错误 → 可选清理，不阻塞测试
